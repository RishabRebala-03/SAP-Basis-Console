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
    SAP_MOCK = os.getenv("SAP_MOCK", "false").lower() == "true"
    
    SAP_CLIENT = os.getenv("SAP_CLIENT", "100")

    # Configured SAP Systems list
    SAP_SYSTEMS = {
        "SHD": {
            "url": os.getenv("SAP_SHD_URL", "http://183.82.103.80:8011/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_SHD_USER", "AITEST1"),
            "pass": os.getenv("SAP_SHD_PASS", "Naxrita@2026"),
            "client": SAP_CLIENT
        },
        "EMP": {
            "url": os.getenv("SAP_EMP_URL", "http://49.206.197.17:8031/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_EMP_USER", "AITEST1"),
            "pass": os.getenv("SAP_EMP_PASS", "Naxrita@2026"),
            "client": SAP_CLIENT
        },
        "EMQ": {
            "url": os.getenv("SAP_EMQ_URL", "http://49.206.197.17:8033/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_EMQ_USER", "AITEST1"),
            "pass": os.getenv("SAP_EMQ_PASS", "Naxrita@2026"),
            "client": SAP_CLIENT
        },
        "EMD": {
            "url": os.getenv("SAP_EMD_URL", "http://49.206.197.17:8006/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_EMD_USER", "AITEST1"),
            "pass": os.getenv("SAP_EMD_PASS", "Naxrita@2026"),
            "client": SAP_CLIENT
        }
    }
