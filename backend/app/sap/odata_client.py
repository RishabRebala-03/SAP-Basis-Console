import requests
import urllib3
from urllib3.util import Retry
from requests.adapters import HTTPAdapter
from flask import current_app
import logging
import time

# Suppress InsecureRequestWarning for self-signed SAP certs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

class ODataClient:
    def __init__(self, system_id, config_dict=None):
        self.system_id = system_id
        # Fallback to configured settings if config_dict is empty
        if not config_dict:
            sap_config = current_app.config.get("SAP_SYSTEMS", {})
            config_dict = sap_config.get(system_id, {})
            
        self.base_url = config_dict.get("url") or ""
        self.user = config_dict.get("user") or ""
        self.password = config_dict.get("pass") or ""
        self.client = config_dict.get("client") or "100"
        self.is_mock = current_app.config.get("SAP_MOCK", True)
        self.timeout = 30  # 30 seconds timeout for real SAP systems
        
        # Configure retry strategy for live connections
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Disable SSL verification for internal SAP systems with self-signed certs
        self.session.verify = False

    def _get_headers(self, csrf_token=None, content_type="application/json"):
        headers = {
            "Accept": "application/json",
            "sap-client": self.client,
            "X-Requested-With": "XMLHttpRequest"
        }
        if content_type:
            headers["Content-Type"] = content_type
        if csrf_token:
            headers["X-CSRF-Token"] = csrf_token
        return headers

    def fetch_csrf_token(self):
        """Fetches the CSRF token needed for state-modifying HTTP actions in SAP."""
        if self.is_mock:
            return "MOCK-CSRF-TOKEN-XYZ123", {"sap-usercontext": "sap-client=" + self.client}

        url = f"{self.base_url.rstrip('/')}/"
        headers = {
            "X-CSRF-Token": "Fetch",
            "sap-client": self.client,
            "X-Requested-With": "XMLHttpRequest"
        }
        params = {"sap-client": self.client}
        try:
            logger.info(f"Fetching CSRF token from {url} (Client: {self.client})")
            response = self.session.get(
                url, 
                auth=(self.user, self.password), 
                headers=headers,
                params=params,
                timeout=self.timeout
            )
            if response.status_code == 401:
                raise Exception(f"SAP Gateway Authentication Error (401 Unauthorized): Service user '{self.user}' on client {self.client} rejected by SAP system {self.system_id}. Service user '{self.user}' may be locked or credentials need updating on SAP.")
            response.raise_for_status()
            token = response.headers.get("X-CSRF-Token") or response.headers.get("x-csrf-token")
            cookies = response.cookies.get_dict()
            logger.info(f"CSRF token obtained successfully for {self.system_id}")
            return token, cookies
        except Exception as e:
            logger.error(f"Error fetching CSRF token from SAP {self.system_id}: {str(e)}")
            raise Exception(str(e) if "SAP Gateway" in str(e) else f"Failed to connect to SAP system {self.system_id}: {str(e)}")

    def request(self, method, entity_set, payload=None, query_params=None):
        """Performs a generic request against the OData API."""
        if self.is_mock:
            return self._execute_mock(method, entity_set, payload, query_params)

        try:
            # 1. Fetch CSRF token for writing actions
            csrf_token = None
            cookies = {}
            if method in ["POST", "PUT", "PATCH", "DELETE"]:
                csrf_token, cookies = self.fetch_csrf_token()

            # 2. Build URL - append entity set to base service URL
            url = f"{self.base_url.rstrip('/')}/{entity_set}"
            
            # 3. Setup headers and request args
            headers = self._get_headers(csrf_token)
            
            # Build query params - always include sap-client
            params = {"sap-client": self.client}
            if query_params:
                params.update(query_params)
            
            req_args = {
                "auth": (self.user, self.password),
                "headers": headers,
                "timeout": self.timeout,
                "params": params
            }
            if cookies:
                req_args["cookies"] = cookies
            if payload:
                req_args["json"] = payload

            # 4. Perform call
            logger.info(f"SAP Request: {method} {url} | System: {self.system_id} | Params: {params}")
            start_time = time.time()
            response = self.session.request(method, url, **req_args)
            duration = time.time() - start_time
            logger.info(f"SAP Response: {response.status_code} in {duration:.3f}s | System: {self.system_id}")
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 204:
                return {"message": "Success (No Content)"}
            else:
                self._handle_error_response(response)
        except Exception as e:
            logger.error(f"HTTP Connection/Authentication failure to live SAP {self.system_id}: {str(e)}")
            raise Exception(f"Live SAP Gateway {self.system_id} Error: {str(e)}")

    def batch_request(self, operations):
        """
        Executes an OData $batch request containing multiple operations.
        Each operation is a dict: {"method": "POST", "entity_set": "UserSet", "payload": {...}}
        """
        if self.is_mock:
            results = []
            for op in operations:
                try:
                    res = self._execute_mock(op["method"], op["entity_set"], op["payload"])
                    results.append({"status": "Success", "data": res})
                except Exception as e:
                    results.append({"status": "Failed", "message": str(e)})
            return results

        import uuid
        import json
        import re

        batch_boundary = f"batch_{uuid.uuid4()}"
        changeset_boundary = f"changeset_{uuid.uuid4()}"
        
        body = []
        body.append(f"--{batch_boundary}")
        body.append(f"Content-Type: multipart/mixed; boundary={changeset_boundary}")
        body.append("")
        
        for op in operations:
            body.append(f"--{changeset_boundary}")
            body.append("Content-Type: application/http")
            body.append("Content-Transfer-Encoding: binary")
            body.append("")
            body.append(f"{op['method']} {op['entity_set']} HTTP/1.1")
            body.append("Accept: application/json")
            body.append("Content-Type: application/json")
            body.append("")
            body.append(json.dumps(op["payload"]))
            body.append("")
            
        body.append(f"--{changeset_boundary}--")
        body.append(f"--{batch_boundary}--")
        body.append("")
        
        payload_str = "\r\n".join(body)
        
        csrf_token, cookies = self.fetch_csrf_token()
        headers = self._get_headers(csrf_token, content_type=f"multipart/mixed; boundary={batch_boundary}")
        
        url = f"{self.base_url.rstrip('/')}/$batch"
        req_args = {
            "auth": (self.user, self.password),
            "headers": headers,
            "timeout": self.timeout,
            "data": payload_str,
            "params": {"sap-client": self.client}
        }
        if cookies:
            req_args["cookies"] = cookies
            
        try:
            logger.info(f"SAP Batch Request: POST {url} with {len(operations)} operations | System: {self.system_id}")
            response = self.session.post(url, **req_args)
            logger.info(f"SAP Batch Response: {response.status_code} | System: {self.system_id}")
            
            if response.status_code not in [200, 202]:
                raise Exception(f"Batch execution failed with HTTP {response.status_code}: {response.text}")
                
            # Parse multipart/mixed response
            content_type = response.headers.get("Content-Type", "")
            match = re.search(r"boundary=(.*)", content_type)
            if not match:
                return [{"status": "Success" if response.status_code in [200, 202] else "Failed", "message": response.text}]
                
            resp_boundary = match.group(1).strip()
            parts = response.text.split(f"--{resp_boundary}")
            
            results = []
            for part in parts:
                if not part.strip() or part.strip() == "--":
                    continue
                if "HTTP/1.1 20" in part or "HTTP/1.1 201" in part or "HTTP/1.1 202" in part:
                    results.append({"status": "Success"})
                elif "HTTP/1.1" in part:
                    error_match = re.search(r'{"error":.*?}', part, re.DOTALL)
                    err_msg = "Operation in batch failed."
                    if error_match:
                        try:
                            err_data = json.loads(error_match.group(0))
                            err_msg = err_data.get("error", {}).get("message", {}).get("value", err_msg)
                        except:
                            pass
                    results.append({"status": "Failed", "message": err_msg})
            
            # Align results count with operations count
            while len(results) < len(operations):
                results.append({"status": "Failed", "message": "No response for this batch operation."})
                
            return results
            
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP Batch failure to SAP {self.system_id}: {str(e)}")
            raise Exception(f"Network error in bulk transaction with SAP System {self.system_id}: {str(e)}")

    def _handle_error_response(self, response):
        """Extracts structured messages from standard SAP RFC/Gateway XML or JSON error envelopes."""
        if response.status_code == 401:
            raise Exception(f"SAP Gateway Authentication Error (401 Unauthorized): Service user '{self.user}' on client {self.client} rejected by SAP system {self.system_id}. Service user '{self.user}' may be locked or credentials need updating on SAP.")
        try:
            error_data = response.json()
            err_msg = error_data.get("error", {}).get("message", {}).get("value", "Unknown SAP error occurred.")
        except Exception:
            err_msg = f"SAP returned HTTP {response.status_code}: {response.text[:200]}"
        
        logger.error(f"SAP error response from {self.system_id}: {err_msg}")
        raise Exception(err_msg)

    def _execute_mock(self, method, entity_set, payload=None, query_params=None):
        """Simulates OData data store using the `sap_users_mock` collection."""
        db = current_app.db
        # Delay to simulate network latency
        time.sleep(0.3)
        
        logger.info(f"Mock SAP Request: {method} {entity_set} (System: {self.system_id})")

        # Entity format: UserSet('USERNAME') or UserSet(UserName='USERNAME')
        # Also support UserLockSet patterns
        is_single_user = ("UserSet('" in entity_set or "UserSet(UserName='" in entity_set or "UserSet(Username='" in entity_set or
                          "UserLockSet('" in entity_set or "UserLockSet(UserName='" in entity_set or "UserLockSet(Username='" in entity_set)
        username = None
        if is_single_user:
            # Extract username
            import re
            match = (re.search(r"UserSet\('(.*?)'\)", entity_set) or 
                     re.search(r"UserSet\(UserName='(.*?)'\)", entity_set) or
                     re.search(r"UserSet\(Username='(.*?)'\)", entity_set) or
                     re.search(r"UserLockSet\('(.*?)'\)", entity_set) or
                     re.search(r"UserLockSet\(UserName='(.*?)'\)", entity_set) or
                     re.search(r"UserLockSet\(Username='(.*?)'\)", entity_set))
            if match:
                username = match.group(1).upper()

        if method == "GET":
            # Search / List Users
            if username:
                # Find single user in mock database
                user = db.sap_users_mock.find_one({"username": username, "system_id": self.system_id})
                if not user:
                    raise Exception(f"User '{username}' not found in SAP system {self.system_id}.")
                return {"d": self._format_mock_user_response(user)}
            else:
                # Query/Search multi
                filter_q = query_params.get("$filter", "") if query_params else ""
                search_params = {}
                search_params["system_id"] = self.system_id
                
                # Simple mock parsing of OData $filter string: substringof('abc', UserName)
                import re
                username_match = re.search(r"substringof\('(.*?)',\s*UserName\)", filter_q, re.IGNORECASE)
                
                if username_match:
                    search_params["username"] = {"$regex": username_match.group(1).upper(), "$options": "i"}

                cursor = db.sap_users_mock.find(search_params)
                users = [self._format_mock_user_response(u) for u in cursor]
                return {"d": {"results": users}}

        elif method == "POST":
            # Handle POST entity sets
            if "UserCreateBulkHdrSet" in entity_set:
                items = payload.get("UserCreateBulk", []) if payload else []
                results = []
                for item in items:
                    item_username = (item.get("Username") or item.get("UserName") or "").upper()
                    if not item_username:
                        results.append({"Status": "E", "Message": "Username is required."})
                        continue
                    new_sap_user = {
                        "username": item_username,
                        "first_name": item.get("FirstName", ""),
                        "last_name": item.get("LastName", ""),
                        "email": item.get("Email", ""),
                        "valid_from": item.get("ValidFrom"),
                        "valid_to": item.get("ValidTo"),
                        "roles": item.get("Roles", []),
                        "profiles": item.get("Profiles", []),
                        "lock_status": "Unlocked",
                        "lock_reason": "",
                        "system_id": self.system_id,
                        "created_at": time.time()
                    }
                    db.sap_users_mock.update_one(
                        {"username": item_username, "system_id": self.system_id},
                        {"$set": new_sap_user},
                        upsert=True
                    )
                    results.append({
                        "SNO": item.get("SNO", payload.get("SNO", "")),
                        "Username": item_username,
                        "Status": "S",
                        "Message": f"User {item_username} created successfully in SAP"
                    })
                return {
                    "d": {
                        "SNO": payload.get("SNO", "") if payload else "",
                        "Status": "S",
                        "Message": "Bulk users created successfully",
                        "UserCreateBulk": {"results": results}
                    }
                }

            if any(target in entity_set for target in ["UserSet", "UserLockSet", "UserCreationSet", "UserPasswordResetSet"]):
                username = (payload.get("Username") or payload.get("UserName") or "").upper()
                if not username:
                    raise Exception("UserName is required.")
                
                action = payload.get("Action", "").upper()
                
                # Check for existing user in mock DB
                existing = db.sap_users_mock.find_one({"username": username, "system_id": self.system_id})
                
                if "UserCreationSet" in entity_set or ("UserSet" in entity_set and not existing):
                    maintenance_fields = {"Roles", "Profiles", "ValidTo"}
                    create_fields = {"Password", "FirstName", "LastName", "Email", "MobileNo", "ValidFrom", "UserType"}
                    is_maintenance = existing and bool(maintenance_fields.intersection(payload.keys())) and not bool(create_fields.intersection(payload.keys()))
                    if existing and "UserCreationSet" in entity_set and not is_maintenance:
                        raise Exception(f"SAP User '{username}' already exists in system {self.system_id}.")
                    if is_maintenance:
                        update_data = {}
                        if "Roles" in payload:
                            update_data["roles"] = payload.get("Roles")
                        if "Profiles" in payload:
                            update_data["profiles"] = payload.get("Profiles")
                        if "ValidTo" in payload:
                            update_data["valid_to"] = payload.get("ValidTo")
                        db.sap_users_mock.update_one(
                            {"username": username, "system_id": self.system_id},
                            {"$set": update_data}
                        )
                        updated_user = db.sap_users_mock.find_one({"username": username, "system_id": self.system_id})
                        data = self._format_mock_user_response(updated_user)
                        data.update({"Username": username, "Status": "S", "Message": "User updated successfully in SAP"})
                        return {"d": data}
                    new_sap_user = {
                        "username": username,
                        "first_name": payload.get("FirstName", ""),
                        "last_name": payload.get("LastName", ""),
                        "email": payload.get("Email", ""),
                        "valid_from": payload.get("ValidFrom"),
                        "valid_to": payload.get("ValidTo"),
                        "roles": payload.get("Roles", []),
                        "profiles": payload.get("Profiles", []),
                        "lock_status": "Unlocked",
                        "lock_reason": "",
                        "system_id": self.system_id,
                        "created_at": time.time()
                    }
                    if not existing:
                        db.sap_users_mock.insert_one(new_sap_user)
                    data = self._format_mock_user_response(new_sap_user if not existing else existing)
                    data.update({"Username": username, "Status": "S", "Message": f"User {username} created successfully in SAP"})
                    return {"d": data}
                
                elif "UserLockSet" in entity_set:
                    act_upper = action.upper()
                    if act_upper == "":
                        # Lookup status request
                        lock_st = existing.get("lock_status", "Unlocked") if existing else "Unlocked"
                        lock_msg = f"User {username} is {lock_st}"
                    else:
                        is_unlock = "UNLOCK" in act_upper or act_upper == "U"
                        lock_st = "Unlocked" if is_unlock else "Locked"
                        lock_msg = f"User {username} UnLocked Successfully" if lock_st == "Unlocked" else f"User {username} Locked Successfully"
                        db.sap_users_mock.update_one(
                            {"username": username, "system_id": self.system_id},
                            {"$set": {"lock_status": lock_st, "username": username, "system_id": self.system_id}},
                            upsert=True
                        )
                    return {
                        "d": {
                            "Username": username,
                            "Action": action,
                            "Status": "S",
                            "Message": lock_msg,
                            "LockStatus": lock_st
                        }
                    }
                else:
                    if "UserPasswordResetSet" in entity_set:
                        return {
                            "d": {
                                "Username": username,
                                "Password": payload.get("Password", ""),
                                "Status": "S",
                                "Message": f"Password reset successfully for user {username}",
                                "LockStatus": existing.get("lock_status", "Unlocked") if existing else "Unlocked"
                            }
                        }
                    return {
                        "d": {
                            "Username": username,
                            "Status": "S",
                            "Message": "Success",
                            "LockStatus": existing.get("lock_status", "Unlocked") if existing else "Unlocked"
                        }
                    }
            else:
                raise Exception("Invalid Mock entity POST target.")

        elif method in ["PUT", "PATCH"]:
            # Update user details, reset password, assign roles/profiles, lock/unlock, etc.
            if not username:
                raise Exception("Username must be provided in the OData target URL.")

            user = db.sap_users_mock.find_one({"username": username, "system_id": self.system_id})
            if not user:
                raise Exception(f"User '{username}' not found in SAP system {self.system_id}.")

            update_data = {}
            if "Password" in payload:
                # Password reset mock
                update_data["password_hash_mock"] = "mocked_hashed_sap_pwd"
            
            if "LockStatus" in payload:
                # Lock/Unlock mock
                update_data["lock_status"] = payload.get("LockStatus")
                update_data["lock_reason"] = payload.get("LockReason", "")
            
            if "ValidTo" in payload:
                update_data["valid_to"] = payload.get("ValidTo")
                update_data["lock_reason"] = payload.get("ExtensionReason", "")

            if "Roles" in payload:
                update_data["roles"] = payload.get("Roles")
            if "Profiles" in payload:
                update_data["profiles"] = payload.get("Profiles")

            # Standard fields update
            for field in ["LastName"]:
                if field in payload:
                    db_field = self._camel_to_snake(field)
                    update_data[db_field] = payload[field]

            if update_data:
                db.sap_users_mock.update_one(
                    {"username": username, "system_id": self.system_id},
                    {"$set": update_data}
                )

            # Retrieve updated
            updated_user = db.sap_users_mock.find_one({"username": username, "system_id": self.system_id})
            return {"d": self._format_mock_user_response(updated_user)}

        elif method == "DELETE":
            if not username:
                raise Exception("Username required for deletion.")
            result = db.sap_users_mock.delete_one({"username": username, "system_id": self.system_id})
            if result.deleted_count == 0:
                raise Exception(f"User '{username}' not found in SAP.")
            return {"message": "User deleted successfully."}

    def _format_mock_user_response(self, user):
        """Translates internal MongoDB dict keys to SAP OData JSON response properties."""
        lock_st = user.get("lock_status", "Unlocked") if user else "Unlocked"
        lock_reas = "" if lock_st.lower() == "unlocked" else (user.get("lock_reason", "") if user else "")
        return {
            "UserName": user.get("username") if user else "",
            "FirstName": user.get("first_name", "") if user else "",
            "LastName": user.get("last_name", "") if user else "",
            "Email": user.get("email", "") if user else "",
            "Department": user.get("department", "") if user else "",
            "ValidFrom": user.get("valid_from") if user else "",
            "ValidTo": user.get("valid_to") if user else "",
            "Roles": user.get("roles", []) if user else [],
            "Profiles": user.get("profiles", []) if user else [],
            "LockStatus": lock_st,
            "LockReason": lock_reas,
            "SystemId": user.get("system_id") if user else self.system_id
        }

    def _camel_to_snake(self, name):
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
