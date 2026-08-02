import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import _helpers
from datetime import datetime
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import gzip


def firestore_serializer(obj):
    """Convert Firestore timestamp objects to ISO format strings."""
    if isinstance(obj, _helpers.DatetimeWithNanoseconds):
        return obj.isoformat()  # Convert Firestore timestamps to string format
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def derive_key(password: str, salt: bytes) -> bytes:
    """Derive a key from the given password and salt."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600000,
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

def encrypt_data(data: bytes, password: str) -> bytes:
    """
    Encrypt data using a password.
    A random 16-byte salt is generated and prepended to the encrypted data.
    """
    salt = os.urandom(16)
    key = derive_key(password, salt)
    fernet = Fernet(key)
    encrypted = fernet.encrypt(data)
    # Prepend the salt so it can be used during decryption.
    return salt + encrypted


def collect_documents(collection, documents):
    """Collect present documents and recursively visit every subcollection."""
    for document_reference in collection.list_documents():
        snapshot = document_reference.get()
        if snapshot.exists:
            documents[document_reference.path] = snapshot.to_dict()

        for subcollection in document_reference.collections():
            collect_documents(subcollection, documents)


def get_firestore_data(db):
    """Fetch every Firestore document and return path-keyed JSON bytes."""
    documents = {}
    for collection in db.collections():
        collect_documents(collection, documents)

    data = {"documents": documents}

    # Convert the data to a JSON string and then to bytes.
    json_data = json.dumps(
        data,
        indent=2,
        default=firestore_serializer,
    ).encode("utf-8")
    return json_data


def initialize_production_backup():
    """Initialize the production client from the existing workflow secrets."""
    firebase_credentials_value = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    backup_password = os.getenv("BACKUP_ENCRYPTION_PASSWORD")

    if not firebase_credentials_value:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is required")
    if not backup_password:
        raise RuntimeError("BACKUP_ENCRYPTION_PASSWORD is required")

    firebase_credentials = json.loads(firebase_credentials_value)
    cred = credentials.Certificate(firebase_credentials)
    app = firebase_admin.initialize_app(cred)
    return firestore.client(app=app), backup_password


if __name__ == "__main__":
    db, backup_password = initialize_production_backup()
    json_data = get_firestore_data(db)
    compressed_data = gzip.compress(json_data)
    encrypted_data = encrypt_data(compressed_data, backup_password)

    backup_filename = f"firestore_backup_{datetime.now().strftime('%Y-%m-%d')}.enc"
    with open(backup_filename, "wb") as f:
        f.write(encrypted_data)

    print("Backup process completed successfully.")
