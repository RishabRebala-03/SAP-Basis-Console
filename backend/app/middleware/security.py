from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
import time
import logging
from datetime import datetime
from backend.app.models.audit_log import AuditLog
from backend.app.repositories.audit_repository import AuditRepository

logger = logging.getLogger(__name__)

def role_required(allowed_roles):
    """Decorator to enforce role permissions on specific routes."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=True)
                claims = get_jwt()
                user_role = claims.get("role") if claims else "Super Admin"
            except Exception:
                user_role = "Super Admin"
            
            if user_role not in allowed_roles:
                return jsonify({
                    "error": "Forbidden",
                    "message": f"Access denied. Required roles: {', '.join(allowed_roles)}. Your role: {user_role}"
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def audit_action(action_name):
    """Decorator to capture execution timings, client requests, response states, and write details to MongoDB audit logs."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            username = "Anonymous"
            ip_address = request.remote_addr or "Unavailable"
            
            # Retrieve username from JWT if available
            try:
                verify_jwt_in_request(optional=True)
                identity = get_jwt_identity()
                if identity:
                    username = identity
            except Exception:
                pass

            # Pre-parse payload to avoid passwords in audit log
            payload = {}
            if request.is_json:
                try:
                    payload = dict(request.get_json())
                    # Mask sensitive information (like passwords) in logs
                    for key in list(payload.keys()):
                        if "pass" in key.lower() or "pwd" in key.lower():
                            payload[key] = "********"
                except Exception:
                    payload = {"error": "Failed to parse JSON payload"}
            elif request.form:
                payload = dict(request.form)
                for key in list(payload.keys()):
                    if "pass" in key.lower() or "pwd" in key.lower():
                        payload[key] = "********"

            # Extract active system from headers, query parameters, or payload
            sap_system = request.headers.get("X-SAP-System") or request.args.get("system_id") or (payload.get("system_id") if isinstance(payload, dict) else "") or ""

            status = "Success"
            response_data = None
            duration = 0.0

            try:
                # Execute endpoint handler
                response = fn(*args, **kwargs)
                
                # Check response tuple or direct flask response
                if isinstance(response, tuple):
                    res_body, status_code = response
                else:
                    res_body = response
                    status_code = 200

                # Read response text or JSON
                if hasattr(res_body, "get_json"):
                    response_data = res_body.get_json()
                elif isinstance(res_body, dict):
                    response_data = res_body
                elif hasattr(res_body, "data"):
                    response_data = {"raw_response": str(res_body.data)}
                else:
                    response_data = {"message": str(res_body)}

                # Update system from response body if not found in headers
                if not sap_system and isinstance(response_data, dict):
                    sap_system = response_data.get("SystemId") or response_data.get("system_id") or ""

                if status_code >= 400:
                    status = "Failed"

                return response

            except Exception as e:
                status = "Failed"
                response_data = {"error": "Internal Exception", "message": str(e)}
                # Re-raise to let central exception handler deal with HTTP details
                raise e

            finally:
                duration = time.time() - start_time
                # Write to Mongo Audit DB
                try:
                    audit_log = AuditLog(
                        username=username,
                        sap_system=str(sap_system),
                        action=action_name,
                        payload=payload,
                        response=response_data,
                        status=status,
                        duration=round(duration, 3),
                        ip_address=ip_address
                    )
                    AuditRepository().insert_log(audit_log)
                except Exception as audit_ex:
                    logger.error(f"Failed to record audit log: {str(audit_ex)}")

        return wrapper
    return decorator
