from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient

# Initialize JWT Manager
jwt = JWTManager()

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Global database client helper
class PyMongoExtension:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        mongo_uri = app.config.get("MONGO_URI")
        db_name = app.config.get("MONGO_DB", "sap_basis_console")
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        # Attach to app context
        app.db = self.db

mongo = PyMongoExtension()
