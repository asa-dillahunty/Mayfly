import gzip
import json
import os
from datetime import datetime, timezone
from urllib import request

from google.auth.credentials import AnonymousCredentials
from google.cloud import firestore
from google.cloud.firestore_v1 import GeoPoint

from firestore_backup import encrypt_data, get_firestore_data
from firestore_restore import decrypt_data


SYNTHETIC_PROJECT_ID = "demo-mayfly-backup-verification"
SYNTHETIC_USER_ID = "synthetic-user-uid"
SYNTHETIC_COMPANY_ID = "synthetic-company"
EMULATOR_HOST = "127.0.0.1:8085"
TEST_PASSWORD = "synthetic-verification-password"

STRUCTURAL_PATHS = (
    f"{SYNTHETIC_USER_ID}/Administrative_Data",
    f"{SYNTHETIC_USER_ID}/2026-07-24",
    f"CompanyList/{SYNTHETIC_COMPANY_ID}",
    f"CompanyList/{SYNTHETIC_COMPANY_ID}/Employees/{SYNTHETIC_USER_ID}",
    f"CompanyList/{SYNTHETIC_COMPANY_ID}/CompanyDocs/Last_Change",
    (
        "SyntheticRoot/root/ArbitraryLevel/missing-parent/"
        "FinalLevel/deep-document"
    ),
)


def require_synthetic_emulator():
    emulator_host = os.getenv("FIRESTORE_EMULATOR_HOST")
    project_id = os.getenv("GCLOUD_PROJECT")
    if emulator_host != EMULATOR_HOST or project_id != SYNTHETIC_PROJECT_ID:
        raise RuntimeError(
            "Backup verification must use the configured synthetic emulator"
        )
    return emulator_host, project_id


def clear_emulator(emulator_host, project_id):
    clear_url = (
        f"http://{emulator_host}/emulator/v1/projects/{project_id}"
        "/databases/(default)/documents"
    )
    clear_request = request.Request(clear_url, method="DELETE")
    with request.urlopen(clear_request, timeout=10) as response:
        if response.status != 200:
            raise RuntimeError(
                f"Firestore emulator clear failed with status {response.status}"
            )


def seed_structural_fixture(db):
    synthetic_timestamp = datetime(2026, 7, 24, 12, 34, 56, tzinfo=timezone.utc)

    db.document(STRUCTURAL_PATHS[0]).set(
        {
            "verificationPath": STRUCTURAL_PATHS[0],
            "company": SYNTHETIC_COMPANY_ID,
            "isAdmin": False,
            "updatedAt": synthetic_timestamp,
        }
    )
    db.document(STRUCTURAL_PATHS[1]).set(
        {
            "verificationPath": STRUCTURAL_PATHS[1],
            "0": {"hours": 1.5},
            "1": {"hours": 0},
            "AdditionalHours": 0.5,
        }
    )
    db.document(STRUCTURAL_PATHS[2]).set(
        {
            "verificationPath": STRUCTURAL_PATHS[2],
            "name": "Synthetic Company",
            "documents": "synthetic-document-field",
            "updatedAt": synthetic_timestamp,
        }
    )
    db.document(STRUCTURAL_PATHS[3]).set(
        {
            "verificationPath": STRUCTURAL_PATHS[3],
            "displayName": "Synthetic Employee",
            "visible": True,
        }
    )
    db.document(STRUCTURAL_PATHS[4]).set(
        {
            "verificationPath": STRUCTURAL_PATHS[4],
            "time": synthetic_timestamp,
        }
    )
    db.document(STRUCTURAL_PATHS[5]).set(
        {
            "verificationPath": STRUCTURAL_PATHS[5],
            "depth": 3,
        }
    )


def json_type_name(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "double"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "map"
    return type(value).__name__


def get_type_probes(db):
    return (
        ("string", "synthetic-string"),
        ("boolean", True),
        ("integer", 7),
        ("double", 1.25),
        ("null", None),
        ("array", ["synthetic", 2]),
        ("map", {"synthetic": True}),
        (
            "timestamp",
            datetime(2026, 7, 24, 12, 34, 56, tzinfo=timezone.utc),
        ),
        ("binary", b"synthetic-bytes"),
        ("geographic", GeoPoint(35.0, -80.0)),
        ("document_reference", db.document("SyntheticReferences/target")),
    )


def observe_value_types(db, emulator_host, project_id):
    results = {}

    for probe_name, probe_value in get_type_probes(db):
        clear_emulator(emulator_host, project_id)
        db.document(f"ValueProbes/{probe_name}").set({"value": probe_value})

        try:
            exported_data = json.loads(get_firestore_data(db))
            exported_value = exported_data["documents"][
                f"ValueProbes/{probe_name}"
            ]["value"]
            observed_json_type = json_type_name(exported_value)
            results[probe_name] = {
                "status": (
                    "preserved"
                    if observed_json_type == probe_name
                    else "transformed"
                ),
                "json_type": observed_json_type,
            }
        except TypeError as error:
            results[probe_name] = {
                "status": "rejected",
                "error_type": type(error).__name__,
            }

    return results


def observe_structure_and_archive(db, emulator_host, project_id):
    clear_emulator(emulator_host, project_id)
    seed_structural_fixture(db)

    exported_json = get_firestore_data(db)
    exported_data = json.loads(exported_json)
    compressed_data = gzip.compress(exported_json, mtime=0)
    encrypted_data = encrypt_data(compressed_data, TEST_PASSWORD)
    restored_json = gzip.decompress(decrypt_data(encrypted_data, TEST_PASSWORD))
    exported_documents = exported_data["documents"]

    return {
        "paths": {
            path: path in exported_documents
            for path in STRUCTURAL_PATHS
        },
        "document_field_preserved": (
            exported_documents[STRUCTURAL_PATHS[2]]["documents"]
            == "synthetic-document-field"
        ),
        "round_trip_matches": restored_json == exported_json,
    }


def build_observations(db, emulator_host, project_id):
    structure_and_archive = observe_structure_and_archive(
        db,
        emulator_host,
        project_id,
    )
    return {
        **structure_and_archive,
        "value_types": observe_value_types(db, emulator_host, project_id),
    }


def create_emulator_client(project_id):
    return firestore.Client(
        project=project_id,
        credentials=AnonymousCredentials(),
    )
