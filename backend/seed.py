import os
import time
from pymongo import MongoClient, ASCENDING, DESCENDING
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/sap_basis_console")
MONGO_DB = os.getenv("MONGO_DB", "sap_basis_console")
SAP_CLIENT = os.getenv("SAP_CLIENT", "100")

def seed_database():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]

    # Create Indexes
    print("Creating database indexes...")
    db.users.create_index([("username", ASCENDING)], unique=True)
    db.users.create_index([("email", ASCENDING)], unique=True)
    
    db.sap_systems.create_index([("system_id", ASCENDING)], unique=True)
    
    db.audit_logs.create_index([("timestamp", DESCENDING)])
    db.audit_logs.create_index([("username", ASCENDING)])
    db.audit_logs.create_index([("sap_system", ASCENDING)])
    
    db.sessions.create_index([("refresh_token", ASCENDING)])
    db.sessions.create_index([("username", ASCENDING)])
    
    # Purge any legacy mock user data from MongoDB
    if "sap_users_mock" in db.list_collection_names():
        print("Purging legacy sap_users_mock collection from MongoDB...")
        db.sap_users_mock.drop()

    # 1. Seed Console Users (Super Admin, Basis Admin, Viewer)
    print("Seeding administrators accounts...")
    users_to_seed = [
        {
            "username": "admin",
            "email": "superadmin@example.com",
            "role": "Super Admin",
            "password_hash": generate_password_hash("Admin@123456"),
            "is_active": True
        },
        {
            "username": "basis_admin",
            "email": "basisadmin@example.com",
            "role": "Basis Admin",
            "password_hash": generate_password_hash("Admin@123456"),
            "is_active": True
        },
        {
            "username": "viewer",
            "email": "viewer@example.com",
            "role": "Viewer",
            "password_hash": generate_password_hash("Viewer@123456"),
            "is_active": True
        }
    ]

    for user in users_to_seed:
        db.users.update_one(
            {"username": user["username"]},
            {"$set": user},
            upsert=True
        )
    print(f"Seeded {len(users_to_seed)} admin roles.")

    # 2. Seed SAP Systems
    print("Seeding SAP landscape configuration registries...")
    systems_to_seed = [
        {
            "system_id": "SHD",
            "name": "SHD",
            "description": "SHD Development",
            "client": SAP_CLIENT,
            "environment": "Development",
            "url": os.getenv("SAP_SHD_URL", "http://183.82.103.80:8011/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_SHD_USER", "AITEST1"),
            "password": os.getenv("SAP_SHD_PASS", "Naxrita@2026"),
            "is_active": True
        },
        {
            "system_id": "EMP",
            "name": "EMP",
            "description": "EMP Development",
            "client": SAP_CLIENT,
            "environment": "Development",
            "url": os.getenv("SAP_EMP_URL", "http://49.206.197.17:8031/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_EMP_USER", "AITEST1"),
            "password": os.getenv("SAP_EMP_PASS", "Naxrita@2026"),
            "is_active": True
        },
        {
            "system_id": "EMQ",
            "name": "EMQ",
            "description": "EMQ Development",
            "client": SAP_CLIENT,
            "environment": "Development",
            "url": os.getenv("SAP_EMQ_URL", "http://49.206.197.17:8033/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_EMQ_USER", "AITEST1"),
            "password": os.getenv("SAP_EMQ_PASS", "Naxrita@2026"),
            "is_active": True
        },
        {
            "system_id": "EMD",
            "name": "EMD",
            "description": "EMD Development",
            "client": SAP_CLIENT,
            "environment": "Development",
            "url": os.getenv("SAP_EMD_URL", "http://49.206.197.17:8006/sap/opu/odata/SAP/ZBSUSERODATA_SRV"),
            "user": os.getenv("SAP_EMD_USER", "AITEST1"),
            "password": os.getenv("SAP_EMD_PASS", "Naxrita@2026"),
            "is_active": True
        }
    ]

    for sys in systems_to_seed:
        db.sap_systems.update_one(
            {"system_id": sys["system_id"]},
            {"$set": sys},
            upsert=True
        )
    print(f"Seeded {len(systems_to_seed)} SAP environments.")
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
