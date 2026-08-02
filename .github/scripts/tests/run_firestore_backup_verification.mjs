import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..", "..", "..");
const firebasePackage = require.resolve("firebase-tools/package.json");
const firebaseCli = join(dirname(firebasePackage), "lib", "bin", "firebase.js");
const projectId = "demo-mayfly-backup-verification";
const emulatorHost = "127.0.0.1";
const emulatorPort = 8085;
const hubPort = 4405;
const websocketPort = 9150;
const emulatorPorts = [emulatorPort, hubPort, websocketPort];
const localPython =
  process.platform === "win32"
    ? join(
        repositoryRoot,
        ".github",
        "scripts",
        ".venv",
        "Scripts",
        "python.exe",
      )
    : join(repositoryRoot, ".github", "scripts", ".venv", "bin", "python");
const pythonCommand = existsSync(localPython)
  ? localPython
  : process.platform === "win32"
    ? "python"
    : "python3";

let firebaseProcess;
let firestorePid;
let cleanupPromise;

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function isPortOpen(port) {
  return new Promise((resolvePortState) => {
    const socket = createConnection({ host: emulatorHost, port });
    let settled = false;

    const finish = (isOpen) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolvePortState(isOpen);
    };

    socket.setTimeout(300);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function getOpenEmulatorPorts() {
  const portStates = await Promise.all(emulatorPorts.map(isPortOpen));
  return emulatorPorts.filter((_, index) => portStates[index]);
}

async function waitForPortsToClose(timeoutMilliseconds) {
  const deadline = Date.now() + timeoutMilliseconds;

  while (Date.now() < deadline) {
    if ((await getOpenEmulatorPorts()).length === 0) return true;
    await delay(200);
  }

  return (await getOpenEmulatorPorts()).length === 0;
}

function runCommand(command, arguments_, options = {}) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, arguments_, {
      cwd: repositoryRoot,
      stdio: "inherit",
      ...options,
    });

    child.once("error", rejectCommand);
    child.once("close", (code) => resolveCommand(code ?? 1));
  });
}

function startEmulator() {
  return spawn(
    process.execPath,
    [
      firebaseCli,
      "emulators:start",
      "--config",
      ".github/scripts/tests/firebase.backup-verification.json",
      "--only",
      "firestore",
      "--project",
      projectId,
    ],
    {
      cwd: repositoryRoot,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        CI: "true",
        FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true",
      },
      stdio: "inherit",
    },
  );
}

async function waitForEmulator() {
  const hubUrl = `http://${emulatorHost}:${hubPort}/emulators`;
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    if (
      firebaseProcess.exitCode !== null ||
      firebaseProcess.signalCode !== null
    ) {
      throw new Error("Firebase CLI exited before Firestore was ready.");
    }

    try {
      const response = await fetch(hubUrl);
      if (response.ok) {
        const firestore = (await response.json()).firestore;
        if (
          Number.isInteger(firestore?.pid) &&
          (await isPortOpen(emulatorPort)) &&
          (await isPortOpen(websocketPort))
        ) {
          return firestore.pid;
        }
      }
    } catch {
      // The hub rejects connections while it is starting.
    }

    await delay(250);
  }

  throw new Error("Timed out waiting for the Firestore emulator.");
}

function runTests() {
  return runCommand(
    pythonCommand,
    [
      "-m",
      "pytest",
      "-c",
      ".github/scripts/tests/pytest.ini",
      "-v",
      ".github/scripts/tests/test_firestore_backup.py",
    ],
    {
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: `${emulatorHost}:${emulatorPort}`,
        GCLOUD_PROJECT: projectId,
      },
    },
  );
}

async function terminateProcess(
  pid,
  { group = false, signal = "SIGKILL" } = {},
) {
  if (!Number.isInteger(pid)) return;

  if (process.platform === "win32") {
    await runCommand("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
    });
    return;
  }

  try {
    process.kill(group ? -pid : pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

async function stopEmulator() {
  if (cleanupPromise) return cleanupPromise;

  cleanupPromise = (async () => {
    console.log("Stopping the Firestore emulator...");
    await terminateProcess(firebaseProcess?.pid, {
      group: true,
      signal: "SIGINT",
    });

    if (!(await waitForPortsToClose(3000))) {
      await terminateProcess(firestorePid);
      if (process.platform !== "win32") {
        await terminateProcess(firebaseProcess?.pid, { group: true });
      }
    }

    const closed = await waitForPortsToClose(3000);
    if (closed) {
      console.log("Firestore emulator stopped.");
    } else {
      const openPorts = await getOpenEmulatorPorts();
      console.error(
        `Emulator cleanup failed; open ports: ${openPorts.join(", ")}`,
      );
    }
    return closed;
  })();

  return cleanupPromise;
}

async function handleSignal(signal) {
  await stopEmulator();
  process.exit(signal === "SIGINT" ? 130 : 143);
}

process.once("SIGINT", () => void handleSignal("SIGINT"));
process.once("SIGTERM", () => void handleSignal("SIGTERM"));

async function main() {
  const occupiedPorts = await getOpenEmulatorPorts();
  if (occupiedPorts.length > 0) {
    throw new Error(
      `Emulator port already in use: ${occupiedPorts.join(", ")}`,
    );
  }

  let testExitCode;
  let cleanupSucceeded;

  try {
    firebaseProcess = startEmulator();
    firebaseProcess.once("error", (error) => {
      console.error(`Could not start Firebase CLI: ${error.message}`);
    });
    firestorePid = await waitForEmulator();
    console.log("Firestore emulator ready; running backup verification tests.");
    testExitCode = await runTests();
  } finally {
    cleanupSucceeded = await stopEmulator();
  }

  if (testExitCode !== 0 || !cleanupSucceeded) {
    process.exitCode = testExitCode || 1;
  }
}

main().catch((error) => {
  console.error(`Backup verification failed: ${error.message}`);
  process.exitCode = 1;
});
