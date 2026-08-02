# Firestore backup verification

This verification checks the required behavior of `firestore_backup.py`
against synthetic data in the local Firestore emulator. It does not connect to
a live Firebase project.

## Setup

Prerequisites are Node.js supported by the repository dependencies, Java 11 or
newer, and Python 3.10 or newer.

From the repository root in PowerShell:

```powershell
py -3.11 -m venv --clear .github\scripts\.venv
.\.github\scripts\.venv\Scripts\python.exe -m pip install -r .github\scripts\requirements-backup-verification.txt
```

The npm runner uses that local virtual environment when it exists, so it does
not need to be activated.

## Run

```powershell
npm run verify:firestore-backup
```

The command:

1. starts Firestore on the fixed demo project
   `demo-mayfly-backup-verification`;
2. runs four focused tests for top-level documents, nested-subcollection
   documents, Firestore value types, and the compressed/encrypted archive
   round-trip; and
3. stops the processes it started and fails unless ports 8085, 4405, and 9150
   are closed.

The Python client uses anonymous credentials and requires the exact emulator
host and demo project supplied by the npm runner. Other Firebase environment
variables are not used by the verification.

The current exporter produces two passes and two intentional failures. It
includes top-level documents and completes the archive round-trip, but omits
nested-subcollection documents and does not preserve every seeded Firestore
value type. The command therefore exits nonzero until those production defects
are repaired. The exact findings are recorded in
`docs/planning/tickets/in-progress/FLY-025.md`.

The dedicated emulator configuration intentionally does not load production
Firestore Rules because this test exercises the server-side exporter, not
client authorization.
