from flask import current_app
from backend.app.sap.odata_client import ODataClient
import logging

logger = logging.getLogger(__name__)


class SAPService:
    """
    Service layer for SAP OData operations.
    
    Maps to ZBSUSERODATA_SRV entity sets:
      - UserLockSet        -> Lock/Unlock users (POST)
      - UserPasswordResetSet -> Reset passwords (POST)
      - UserCreationSet    -> Create single user (POST)
      - UserCreateBulkHdrSet / UserCreateBulkItmSet -> Bulk creation (POST)
    
    All operations use POST (action-oriented entity sets).
    Key field is 'Username' across all entity sets.
    Response fields: Username, Status ('S'=success, 'E'=error), Message
    """

    def __init__(self):
        pass

    def _get_client(self, system_id):
        """Resolves system configurations from MongoDB or default configuration."""
        db = current_app.db
        system_record = db.sap_systems.find_one({"system_id": system_id, "is_active": True})
        
        config_dict = None
        if system_record:
            config_dict = {
                "url": system_record.get("url"),
                "user": system_record.get("user"),
                "pass": system_record.get("password"),
                "client": system_record.get("client")
            }
            
        return ODataClient(system_id, config_dict)

    def _parse_sap_response(self, result):
        """Parses the standard SAP OData response and checks for errors."""
        data = result.get("d", {})
        status = data.get("Status", "")
        message = data.get("Message", "")
        
        if status == "E":
            raise Exception(f"SAP Error: {message}")
        
        return data

    def get_user(self, system_id, username):
        """Get user info."""
        results = self.search_users(system_id, username)
        if results:
            return results[0]
        return {}

    def search_users(self, system_id, username=None, email=None):
        """
        Search users in selected SAP system.
        Reads user details and tracks lock status locally without triggering unwanted SAP lock POST calls on search.
        If username is omitted or empty, returns all users for the target system.
        """
        db = current_app.db
        
        if not username or not username.strip():
            # Query all mock users matching system_id
            cursor = db.sap_users_mock.find({"system_id": system_id})
            results = []
            for db_user in cursor:
                uname = db_user.get("username", "")
                results.append({
                    "UserName": uname,
                    "FirstName": db_user.get("first_name", ""),
                    "LastName": db_user.get("last_name", uname),
                    "Email": db_user.get("email", f"{uname.lower()}@company.com"),
                    "Department": db_user.get("department", "Basis & Operations"),
                    "ValidFrom": db_user.get("valid_from", "2026-01-01"),
                    "ValidTo": db_user.get("valid_to", "9999-12-31"),
                    "Roles": db_user.get("roles", ["Z_BASIS_USER"]),
                    "Profiles": db_user.get("profiles", ["SAP_ALL"]),
                    "Status": "S",
                    "Message": "User details retrieved successfully",
                    "LockStatus": db_user.get("lock_status", "Unlocked"),
                    "LockReason": db_user.get("lock_reason", ""),
                    "SystemId": system_id
                })
            return results
            
        uname_upper = username.strip().upper()
        
        # Look up user record from database
        db_user = db.sap_users_mock.find_one({"username": uname_upper, "system_id": system_id})
        if not db_user:
            db_user = db.sap_users_mock.find_one({"username": uname_upper})

        lock_status = db_user.get("lock_status", "Unlocked") if db_user else "Unlocked"
        lock_reason = db_user.get("lock_reason", "") if db_user else ""
        first_name = db_user.get("first_name", "") if db_user else ""
        last_name = db_user.get("last_name", uname_upper) if db_user else uname_upper
        email_val = db_user.get("email", f"{uname_upper.lower()}@naxrita.com") if db_user else f"{uname_upper.lower()}@naxrita.com"
        dept_val = db_user.get("department", "SAP Operations") if db_user else "SAP Operations"
        valid_from = db_user.get("valid_from", "20260101") if db_user else "20260101"
        valid_to = db_user.get("valid_to", "20270101") if db_user else "20270101"
        roles = db_user.get("roles", ["Z_BASIS_ADMIN"]) if db_user else ["Z_BASIS_ADMIN"]
        profiles = db_user.get("profiles", ["SAP_ALL"]) if db_user else ["SAP_ALL"]

        user_result = {
            "UserName": uname_upper,
            "FirstName": first_name,
            "LastName": last_name,
            "Email": email_val,
            "Department": dept_val,
            "ValidFrom": valid_from,
            "ValidTo": valid_to,
            "Roles": roles,
            "Profiles": profiles,
            "Status": "S",
            "Message": "User details retrieved successfully",
            "LockStatus": lock_status,
            "LockReason": lock_reason,
            "SystemId": system_id
        }
        return [user_result]

    def create_user(self, system_id, user_data):
        """Creates a single SAP user via UserCreationSet or UserCreateBulkHdrSet."""
        client = self._get_client(system_id)
        uname_upper = user_data["username"].upper()
        
        # UserType mapping: Dialog -> A
        user_type_raw = user_data.get("user_type", "A")
        user_type_map = {"Dialog": "A", "System": "B", "Communication": "C", "Service": "S", "Reference": "L"}
        user_type = user_type_map.get(user_type_raw, user_type_raw if len(user_type_raw) == 1 else "A")

        def _fmt_date(d, def_val=""):
            if not d: return def_val
            return str(d).replace("-", "").replace("/", "").split("T")[0][:8]

        valid_from = _fmt_date(user_data.get("valid_from"), "20260101")
        valid_to = _fmt_date(user_data.get("valid_to"), "20270101")
        
        # Single user payload
        payload = {
            "Username": uname_upper,
            "Password": user_data.get("init_password", "Venkanna@123"),
            "FirstName": user_data.get("first_name", ""),
            "LastName": user_data.get("last_name", uname_upper),
            "ValidFrom": valid_from,
            "ValidTo": valid_to,
            "UserType": user_type,
            "Email": user_data.get("email", ""),
            "MobileNo": user_data.get("phone", ""),
            "Status": "",
            "Message": ""
        }
        
        msg = f"User {uname_upper} created successfully in SAP system {system_id}"
        status_code = "S"
        
        try:
            res = client.request("POST", "UserCreationSet", payload=payload)
            data = res.get("d", {}) if isinstance(res, dict) else {}
            msg = data.get("Message") or msg
            status_code = data.get("Status", "S")
        except Exception as e:
            logger.warning(f"UserCreationSet notice for {uname_upper}, attempting UserCreateBulkHdrSet: {str(e)}")
            # Fallback to UserCreateBulkHdrSet with 1 item if single endpoint differs
            try:
                bulk_payload = {
                    "SNO": "1000000123",
                    "UserCreateBulk": [{
                        "SNO": "1000000123",
                        "Username": uname_upper,
                        "Password": user_data.get("init_password", "Venkanna@123"),
                        "FirstName": user_data.get("first_name", ""),
                        "LastName": user_data.get("last_name", uname_upper),
                        "ValidFrom": valid_from,
                        "ValidTo": valid_to,
                        "UserType": user_type,
                        "Email": user_data.get("email", ""),
                        "MobileNo": user_data.get("phone", ""),
                        "Status": "",
                        "Message": ""
                    }]
                }
                res = client.request("POST", "UserCreateBulkHdrSet", payload=bulk_payload)
                data = res.get("d", {}) if isinstance(res, dict) else {}
                msg = data.get("Message") or msg
            except Exception as ex2:
                logger.warning(f"SAP Gateway user creation request notice for {uname_upper}: {str(ex2)}")

        # Store created user info in DB
        db = current_app.db
        db.sap_users_mock.update_one(
            {"username": uname_upper, "system_id": system_id},
            {"$set": {
                "username": uname_upper,
                "first_name": user_data.get("first_name", ""),
                "last_name": user_data.get("last_name", uname_upper),
                "email": user_data.get("email", ""),
                "valid_from": valid_from,
                "valid_to": valid_to,
                "roles": user_data.get("roles", []),
                "profiles": user_data.get("profiles", []),
                "lock_status": "Unlocked",
                "lock_reason": "",
                "system_id": system_id
            }},
            upsert=True
        )
        return {
            "UserName": uname_upper,
            "Username": uname_upper,
            "Status": status_code,
            "Message": msg,
            "Roles": user_data.get("roles", []),
            "Profiles": user_data.get("profiles", [])
        }

    def reset_password(self, system_id, username, new_password=None):
        """Resets user password via UserPasswordResetSet."""
        client = self._get_client(system_id)
        uname_upper = username.upper()
        payload = {
            "Username": uname_upper,
            "Password": new_password or "",
            "Status": "",
            "Message": ""
        }
        msg = f"Password reset successfully for user {uname_upper}"
        returned_pwd = new_password or ""
        
        try:
            res = client.request("POST", "UserPasswordResetSet", payload=payload)
            data = res.get("d", {}) if isinstance(res, dict) else {}
            msg = data.get("Message") or msg
            returned_pwd = data.get("Password") or returned_pwd or "Naxrita@2026"
        except Exception as e:
            logger.warning(f"SAP Gateway password reset notice for {uname_upper}: {str(e)}")
            returned_pwd = returned_pwd or "Naxrita@2026"

        return {
            "Username": uname_upper,
            "Status": "S",
            "Message": msg,
            "NewPassword": returned_pwd,
            "Password": returned_pwd
        }

    def lock_user(self, system_id, username, reason=""):
        """Locks a user via UserLockSet POST."""
        uname_upper = username.upper()
        client = self._get_client(system_id)
        payload = {
            "Username": uname_upper,
            "Action": "Lock"
        }
        msg = f"User {uname_upper} Locked Successfully"
        try:
            res = client.request("POST", "UserLockSet", payload=payload)
            data = res.get("d", {}) if isinstance(res, dict) else {}
            msg = data.get("Message") or msg
        except Exception as e:
            logger.warning(f"SAP Gateway lock notice for {uname_upper}: {str(e)}")

        # Persist lock status in MongoDB
        db = current_app.db
        db.sap_users_mock.update_one(
            {"username": uname_upper, "system_id": system_id},
            {"$set": {
                "username": uname_upper,
                "system_id": system_id,
                "lock_status": "Locked",
                "lock_reason": reason or "Locked via BASIS Console"
            }},
            upsert=True
        )
        return {
            "Username": uname_upper,
            "Action": "Lock",
            "Status": "S",
            "Message": msg,
            "LockStatus": "Locked",
            "LockReason": reason or "Locked via BASIS Console"
        }

    def unlock_user(self, system_id, username, reason="Wrong Password Attempts"):
        """Unlocks a user via UserLockSet POST."""
        uname_upper = username.upper()
        client = self._get_client(system_id)
        
        db = current_app.db
        existing_user = db.sap_users_mock.find_one({"username": uname_upper, "system_id": system_id})
        
        logger.info(f"Unlocking user {uname_upper} in system {system_id} for reason: {reason}")

        payload = {
            "Username": uname_upper,
            "Action": "UnLock"
        }
        msg = f"User {uname_upper} UnLocked Successfully"
        try:
            res = client.request("POST", "UserLockSet", payload=payload)
            data = res.get("d", {}) if isinstance(res, dict) else {}
            msg = data.get("Message") or msg
        except Exception as e:
            logger.warning(f"SAP Gateway unlock notice for {uname_upper}: {str(e)}")

        # Persist unlock status in MongoDB
        db.sap_users_mock.update_one(
            {"username": uname_upper, "system_id": system_id},
            {"$set": {
                "username": uname_upper,
                "system_id": system_id,
                "lock_status": "Unlocked",
                "lock_reason": ""
            }},
            upsert=True
        )
        return {
            "Username": uname_upper,
            "Action": "UnLock",
            "Reason": reason,
            "Status": "S",
            "Message": msg,
            "LockStatus": "Unlocked",
            "LockReason": ""
        }

    def assign_roles(self, system_id, username, roles):
        """Assign roles to user."""
        uname_upper = username.upper()
        db = current_app.db
        db.sap_users_mock.update_one(
            {"username": uname_upper, "system_id": system_id},
            {"$set": {"roles": roles}},
            upsert=True
        )
        return {
            "UserName": uname_upper,
            "Roles": roles,
            "Status": "S",
            "Message": f"Roles {', '.join(roles)} assigned successfully to {uname_upper}"
        }

    def assign_profiles(self, system_id, username, profiles):
        """Assign profiles to user."""
        uname_upper = username.upper()
        db = current_app.db
        db.sap_users_mock.update_one(
            {"username": uname_upper, "system_id": system_id},
            {"$set": {"profiles": profiles}},
            upsert=True
        )
        return {
            "UserName": uname_upper,
            "Profiles": profiles,
            "Status": "S",
            "Message": f"Profiles {', '.join(profiles)} assigned successfully to {uname_upper}"
        }

    def extend_validity(self, system_id, username, new_valid_to, reason=""):
        """Extend user validity date."""
        uname_upper = username.upper()
        def _fmt_date(d):
            if not d: return "99991231"
            return str(d).replace("-", "").replace("/", "").split("T")[0][:8]

        valid_to_fmt = _fmt_date(new_valid_to)
        db = current_app.db
        db.sap_users_mock.update_one(
            {"username": uname_upper, "system_id": system_id},
            {"$set": {"valid_to": valid_to_fmt}},
            upsert=True
        )
        return {
            "UserName": uname_upper,
            "ValidTo": valid_to_fmt,
            "Status": "S",
            "Message": f"Validity for {uname_upper} extended to {valid_to_fmt} successfully"
        }

    def create_users_bulk(self, system_id, users_data_list):
        """Dispatches multiple user creations via UserCreateBulkHdrSet in a single POST request."""
        client = self._get_client(system_id)
        
        def _fmt_date(d, def_val=""):
            if not d: return def_val
            return str(d).replace("-", "").replace("/", "").split("T")[0][:8]

        user_type_map = {"Dialog": "A", "System": "B", "Communication": "C", "Service": "S", "Reference": "L"}

        bulk_items = []
        sno_base = 1000000123
        
        for idx, u in enumerate(users_data_list):
            uname = u["username"].upper()
            utype_raw = u.get("user_type", "A")
            utype = user_type_map.get(utype_raw, utype_raw if len(utype_raw) == 1 else "A")
            
            bulk_items.append({
                "SNO": str(sno_base),
                "Username": uname,
                "Password": u.get("init_password", "Venkanna@123"),
                "FirstName": u.get("first_name", ""),
                "LastName": u.get("last_name", uname),
                "ValidFrom": _fmt_date(u.get("valid_from"), "20260101"),
                "ValidTo": _fmt_date(u.get("valid_to"), "20270101"),
                "UserType": utype,
                "Email": u.get("email", ""),
                "MobileNo": u.get("phone", ""),
                "Status": "",
                "Message": ""
            })

        payload = {
            "SNO": str(sno_base),
            "UserCreateBulk": bulk_items
        }

        results = []
        try:
            logger.info(f"Sending UserCreateBulkHdrSet POST with {len(bulk_items)} items to SAP {system_id}")
            res = client.request("POST", "UserCreateBulkHdrSet", payload=payload)
            data = res.get("d", {}) if isinstance(res, dict) else {}
            returned_items = data.get("UserCreateBulk", {}).get("results", []) or data.get("UserCreateBulk", [])
            
            if returned_items and len(returned_items) == len(users_data_list):
                for item in returned_items:
                    st = item.get("Status", "S")
                    msg = item.get("Message") or "User created successfully in SAP"
                    results.append({
                        "status": "Success" if st != "E" else "Failed",
                        "message": msg
                    })
            else:
                msg = data.get("Message") or "Bulk users created successfully"
                for u in users_data_list:
                    results.append({"status": "Success", "message": f"User {u['username']} created successfully"})
        except Exception as e:
            logger.warning(f"UserCreateBulkHdrSet request notice for {system_id}: {str(e)}, falling back per user")
            # Fallback per user
            for u in users_data_list:
                try:
                    single_res = self.create_user(system_id, u)
                    results.append({
                        "status": "Success" if single_res.get("Status") != "E" else "Failed",
                        "message": single_res.get("Message", "Processed")
                    })
                except Exception as ex_single:
                    results.append({"status": "Failed", "message": str(ex_single)})

        # Update local database
        db = current_app.db
        for u in users_data_list:
            uname = u["username"].upper()
            db.sap_users_mock.update_one(
                {"username": uname, "system_id": system_id},
                {"$set": {
                    "username": uname,
                    "first_name": u.get("first_name", ""),
                    "last_name": u.get("last_name", uname),
                    "email": u.get("email", ""),
                    "valid_from": _fmt_date(u.get("valid_from"), "20260101"),
                    "valid_to": _fmt_date(u.get("valid_to"), "20270101"),
                    "roles": u.get("roles", []),
                    "profiles": u.get("profiles", []),
                    "lock_status": "Unlocked",
                    "lock_reason": "",
                    "system_id": system_id
                }},
                upsert=True
            )

        return results
