import os
import time
from pymongo import MongoClient, ASCENDING, DESCENDING
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/sap_basis_console")
MONGO_DB = os.getenv("MONGO_DB", "sap_basis_console")

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
    
    db.sap_users_mock.create_index([("system_id", ASCENDING), ("username", ASCENDING)], unique=True)

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
            "name": "SAP S/4HANA Development",
            "description": "Development environment for sandboxing and configuration changes",
            "client": os.getenv("SAP_SHD_CLIENT", "100"),
            "url": os.getenv("SAP_SHD_URL", "https://sap-gateway-shd.example.com/sap/opu/odata/sap/ZUSER_MANAGEMENT_SRV/"),
            "user": os.getenv("SAP_SHD_USER", "BASIS_ADMIN"),
            "password": os.getenv("SAP_SHD_PASS", "SHD_Password_123"),
            "is_active": True
        },
        {
            "system_id": "EMP",
            "name": "SAP ERP Production",
            "description": "Production environment for enterprise operations",
            "client": os.getenv("SAP_EMP_CLIENT", "200"),
            "url": os.getenv("SAP_EMP_URL", "https://sap-gateway-emp.example.com/sap/opu/odata/sap/ZUSER_MANAGEMENT_SRV/"),
            "user": os.getenv("SAP_EMP_USER", "BASIS_ADMIN"),
            "password": os.getenv("SAP_EMP_PASS", "EMP_Password_123"),
            "is_active": True
        },
        {
            "system_id": "EMQ",
            "name": "SAP ERP Quality Assurance",
            "description": "QA and user acceptance testing system",
            "client": os.getenv("SAP_EMQ_CLIENT", "300"),
            "url": os.getenv("SAP_EMQ_URL", "https://sap-gateway-emq.example.com/sap/opu/odata/sap/ZUSER_MANAGEMENT_SRV/"),
            "user": os.getenv("SAP_EMQ_USER", "BASIS_ADMIN"),
            "password": os.getenv("SAP_EMQ_PASS", "EMQ_Password_123"),
            "is_active": True
        },
        {
            "system_id": "EMD",
            "name": "SAP ERP Development",
            "description": "Development environment for ABAP and customization workflows",
            "client": os.getenv("SAP_EMD_CLIENT", "400"),
            "url": os.getenv("SAP_EMD_URL", "https://sap-gateway-emd.example.com/sap/opu/odata/sap/ZUSER_MANAGEMENT_SRV/"),
            "user": os.getenv("SAP_EMD_USER", "BASIS_ADMIN"),
            "password": os.getenv("SAP_EMD_PASS", "EMD_Password_123"),
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

    # 3. Seed real SAP accounts registry
    print("Seeding real SAP user accounts registry...")
    real_users_to_seed = [
        {
            "username": "RISHAB",
            "first_name": "Rishab",
            "last_name": "Rebala",
            "email": "rishab@naxrita.com",
            "valid_from": "20260101",
            "valid_to": "20270101",
            "roles": ["SAP_ALL", "Z_BASIS_ADMIN"],
            "profiles": ["SAP_ALL"],
            "lock_status": "Unlocked",
            "lock_reason": ""
        },
        {
            "username": "AITEST1",
            "first_name": "AI",
            "last_name": "Test1",
            "email": "aitest1@naxrita.com",
            "valid_from": "20260101",
            "valid_to": "20270101",
            "roles": ["Z_BASIS_ADMIN"],
            "profiles": ["SAP_ALL"],
            "lock_status": "Unlocked",
            "lock_reason": ""
        },
        {
            "username": "DEV02",
            "first_name": "Dev",
            "last_name": "User02",
            "email": "srinivasarao.rajarapu@naxrita.com",
            "valid_from": "20260101",
            "valid_to": "20270101",
            "roles": ["Z_DEVELOPER_FULL"],
            "profiles": ["S_DEVELOP"],
            "lock_status": "Unlocked",
            "lock_reason": ""
        },
        {
            "username": "BULK1",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "valid_from": "20260101",
            "valid_to": "20270101",
            "roles": ["Z_BASIS_ADMIN"],
            "profiles": ["SAP_ALL"],
            "lock_status": "Unlocked",
            "lock_reason": ""
        },
        {
            "username": "BULK2",
            "first_name": "Anna",
            "last_name": "Smith",
            "email": "anna.smith@example.com",
            "valid_from": "20260101",
            "valid_to": "20270101",
            "roles": ["Z_FI_ACCOUNTANT"],
            "profiles": ["Z_FIN_ALL"],
            "lock_status": "Unlocked",
            "lock_reason": ""
        },
        {
            "username": "TESTUSR1",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "valid_from": "20260101",
            "valid_to": "20270101",
            "roles": ["Z_BASIS_ADMIN"],
            "profiles": ["SAP_ALL"],
            "lock_status": "Unlocked",
            "lock_reason": ""
        }
    ]

    count = 0
    for sys in systems_to_seed:
        sys_id = sys["system_id"]
        for u in real_users_to_seed:
            user_doc = u.copy()
            user_doc["system_id"] = sys_id
            user_doc["created_at"] = time.time()
            db.sap_users_mock.update_one(
                {"system_id": sys_id, "username": user_doc["username"]},
                {"$set": user_doc},
                upsert=True
            )
            count += 1

    print(f"Seeded {count} real SAP user entries across systems.")
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
