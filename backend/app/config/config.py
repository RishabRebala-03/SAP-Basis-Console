import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default-flask-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-jwt-secret-key")
    
    # Token expiration windows
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    
    # JWT Token Locations
    JWT_TOKEN_LOCATION = ["headers", "query_string"]
    JWT_QUERY_STRING_NAME = "token"
    
    # CORS
    CORS_HEADERS = "Content-Type"
    
    # MongoDB Configs
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/sap_basis_console")
    MONGO_DB = os.getenv("MONGO_DB", "sap_basis_console")
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
    RATELIMIT_STORAGE_URI = "memory://"
    
    # SAP Integration Config
    SAP_MOCK = os.getenv("SAP_MOCK", "true").lower() == "true"
    
    # Configured SAP Systems list
    SAP_SYSTEMS = {
        "SHD": {
            "url": os.getenv("SAP_SHD_URL"),
            "user": os.getenv("SAP_SHD_USER"),
            "pass": os.getenv("SAP_SHD_PASS"),
            "client": os.getenv("SAP_SHD_CLIENT", "100")
        },
        "EMP": {
            "url": os.getenv("SAP_EMP_URL"),
            "user": os.getenv("SAP_EMP_USER"),
            "pass": os.getenv("SAP_EMP_PASS"),
            "client": os.getenv("SAP_EMP_CLIENT", "200")
        },
        "EMQ": {
            "url": os.getenv("SAP_EMQ_URL"),
            "user": os.getenv("SAP_EMQ_USER"),
            "pass": os.getenv("SAP_EMQ_PASS"),
            "client": os.getenv("SAP_EMQ_CLIENT", "300")
        },
        "EMD": {
            "url": os.getenv("SAP_EMD_URL"),
            "user": os.getenv("SAP_EMD_USER"),
            "pass": os.getenv("SAP_EMD_PASS"),
            "client": os.getenv("SAP_EMD_CLIENT", "400")
        }
    }
