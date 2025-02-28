import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet

# Load Firebase credentials from GitHub Secrets (encoded as base64)
firebase_credentials = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT_PRIMER_53A41"))
backup_password = os.getenv("BACKUP_ENCRYPTION_PASSWORD")  # Your encryption password

# Initialize Firebase
cred = credentials.Certificate(firebase_credentials)
firebase_admin.initialize_app(cred)
db = firestore.client()

def derive_key(password: str, salt: bytes) -> bytes:
    """Derive a key from the given password and salt."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
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

def backup_firestore():
    """Fetch Firestore data and return the JSON as bytes."""
    data = {}
    collections = db.collections()
    
    for collection in collections:
        collection_name = collection.id
        data[collection_name] = {}
        
        docs = collection.stream()
        for doc in docs:
            data[collection_name][doc.id] = doc.to_dict()
    
    # Convert the data to a JSON string and then to bytes.
    json_data = json.dumps(data, indent=4).encode("utf-8")
    return json_data

if __name__ == "__main__":
    # Backup Firestore data and encrypt it in memory
    json_data = backup_firestore()
    encrypted_data = encrypt_data(json_data, backup_password)
    
    # Save the encrypted backup as a single file
    backup_filename = f"firestore_backup_{datetime.now().strftime('%Y-%m-%d')}.enc"
    with open(backup_filename, "wb") as f:
        f.write(encrypted_data)
    
    print("Backup process completed successfully.")
