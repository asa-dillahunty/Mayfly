import gzip
import base64
from pathlib import Path
from getpass import getpass
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet, InvalidToken
# CONFIG
BACKUP_DIR = Path("../../backups")

def derive_key(password: str, salt: bytes) -> bytes:
    """
    Derive the Fernet encryption key from password + salt.
    Must match the backup script exactly.
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600000,  # must match backup script
    )

    return base64.urlsafe_b64encode(
        kdf.derive(password.encode())
    )


def decrypt_data(encrypted_blob: bytes, password: str) -> bytes:
    """
    Decrypt encrypted backup data.

    Format:
        [16-byte salt][fernet encrypted payload]
    """

    # First 16 bytes are the salt
    salt = encrypted_blob[:16]

    # Remaining bytes are encrypted data
    encrypted_data = encrypted_blob[16:]

    key = derive_key(password, salt)

    fernet = Fernet(key)

    decrypted_data = fernet.decrypt(encrypted_data)

    return decrypted_data


def select_backup_file() -> Path:
    """
    Let the user choose a backup file from BACKUP_DIR.
    """

    if not BACKUP_DIR.exists():
        raise FileNotFoundError(
            f"Backup directory does not exist: {BACKUP_DIR}"
        )

    backup_files = sorted(
        BACKUP_DIR.glob("*.enc"),
        reverse=True
    )

    if not backup_files:
        raise FileNotFoundError(
            f"No .enc backup files found in {BACKUP_DIR}"
        )

    print("\nAvailable backup files:\n")

    for idx, file in enumerate(backup_files, start=1):
        size_mb = file.stat().st_size / (1024 * 1024)

        print(
            f"[{idx}] {file.name} "
            f"({size_mb:.2f} MB)"
        )

    while True:
        selection = input(
            "\nSelect backup number: "
        ).strip()

        if not selection.isdigit():
            print("Please enter a valid number.")
            continue

        selection = int(selection)

        if 1 <= selection <= len(backup_files):
            return backup_files[selection - 1]

        print("Selection out of range.")


def output_backup():
    backup_file = select_backup_file()

    print(f"\nSelected: {backup_file.name}")

    password = getpass(
        "Enter backup password: "
    )

    print("\nReading encrypted backup...")

    with open(backup_file, "rb") as f:
        encrypted_blob = f.read()

    try:
        print("Decrypting backup...")

        compressed_data = decrypt_data(
            encrypted_blob,
            password
        )

    except InvalidToken:
        raise ValueError(
            "Decryption failed. "
            "Incorrect password or corrupted file."
        )

    print("Decompressing backup...")

    json_data = gzip.decompress(compressed_data)

    # Validate JSON before writing
    import json
    parsed = json.loads(json_data)

    output_file = backup_file.with_suffix(".json")

    print(f"Writing restored JSON: {output_file.name}")

    with open(output_file, "wb") as f:
        f.write(json_data)

    print("\nRestore completed successfully.")

if __name__ == "__main__":
    output_backup()