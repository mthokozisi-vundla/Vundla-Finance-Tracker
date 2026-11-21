
import pytest
from fastapi.testclient import TestClient

from main import app
from database import get_db
from models import Base
from test_database import test_engine, TestingSessionLocal


@pytest.fixture
def db():
    Base.metadata.create_all(bind=test_engine)

    database = TestingSessionLocal()

    try:
        yield database
    finally:
        database.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
