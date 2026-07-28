import pytest
import mongomock
from flask import Flask
from flask_jwt_extended import create_access_token

from backend.app import create_app
from backend.app.config.config import Config
from backend.app.extensions.extensions import mongo

class TestConfig(Config):
    TESTING = True
    MONGO_URI = "mongodb://localhost:27017/test_db"
    MONGO_DB = "test_db"
    SAP_MOCK = True
    SECRET_KEY = "test-secret"
    JWT_SECRET_KEY = "test-jwt-secret"
    RATELIMIT_ENABLED = False  # Disable rate limit for testing

@pytest.fixture(scope="function")
def app():
    """Create and configure a clean Flask app instance for each test."""
    app = create_app(TestConfig)
    
    # Mock MongoDB connection using mongomock
    client = mongomock.MongoClient()
    db = client[app.config["MONGO_DB"]]
    app.db = db
    
    # Override standard pymongo extension bindings
    mongo.client = client
    mongo.db = db

    # Seed basic records for testing
    from werkzeug.security import generate_password_hash
    db.users.insert_one({
        "username": "test_admin",
        "email": "test_admin@example.com",
        "role": "Super Admin",
        "password_hash": generate_password_hash("TestPassword123!"),
        "is_active": True
    })

    db.sap_systems.insert_one({
        "system_id": "EMP",
        "name": "EMP",
        "description": "EMP Development",
        "client": "100",
        "environment": "Development",
        "url": "https://sap-test.example.com",
        "user": "TEST_USER",
        "password": "TEST_PASSWORD",
        "is_active": True
    })

    yield app


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()

@pytest.fixture(scope="function")
def admin_headers(app):
    with app.app_context():
        token = create_access_token(identity="test_admin", additional_claims={"role": "Super Admin"})
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
