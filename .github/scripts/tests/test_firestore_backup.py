TOP_LEVEL_PATHS = (
    "synthetic-user-uid/Administrative_Data",
    "synthetic-user-uid/2026-07-24",
    "CompanyList/synthetic-company",
)

NESTED_PATHS = (
    "CompanyList/synthetic-company/Employees/synthetic-user-uid",
    "CompanyList/synthetic-company/CompanyDocs/Last_Change",
    (
        "SyntheticRoot/root/ArbitraryLevel/missing-parent/"
        "FinalLevel/deep-document"
    ),
)


def test_export_includes_top_level_documents(backup_observations):
    paths = backup_observations["paths"]
    assert all(paths[path] for path in TOP_LEVEL_PATHS)


def test_export_includes_nested_subcollection_documents(backup_observations):
    paths = backup_observations["paths"]
    missing_paths = [path for path in NESTED_PATHS if not paths[path]]
    assert missing_paths == []


def test_document_fields_do_not_collide_with_path_metadata(backup_observations):
    assert backup_observations["document_field_preserved"] is True


def test_export_preserves_supported_firestore_value_types(backup_observations):
    value_types = backup_observations["value_types"]
    unsupported_types = {
        value_type: result
        for value_type, result in value_types.items()
        if result["status"] != "preserved"
    }
    assert unsupported_types == {}


def test_archive_round_trip(backup_observations):
    assert backup_observations["round_trip_matches"] is True
