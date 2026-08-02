import pytest

from verify_firestore_backup import (
    build_observations,
    clear_emulator,
    create_emulator_client,
    require_synthetic_emulator,
)


@pytest.fixture(scope="session")
def backup_observations():
    emulator_host, project_id = require_synthetic_emulator()
    db = create_emulator_client(project_id)

    try:
        yield build_observations(db, emulator_host, project_id)
    finally:
        clear_emulator(emulator_host, project_id)
