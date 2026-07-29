from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required
from datetime import datetime
import io
import uuid

from backend.app.sap.sap_service import SAPService
from backend.app.middleware.security import role_required, audit_action
from backend.app.excel import excel_processor
from backend.app.schemas.sap_schemas import (
    CreateUserSchema,
    ResetSAPPasswordSchema,
    LockUserSchema,
    UnlockUserSchema,
    AssignRolesSchema,
    AssignProfilesSchema,
    ExtendValiditySchema
)
from marshmallow import ValidationError

sap_bp = Blueprint("sap", __name__)
sap_service = SAPService()

SAP_SYSTEM_NAMES = {
    "SHD": "SHD",
    "EMP": "EMP",
    "EMQ": "EMQ",
    "EMD": "EMD",
}

SAP_SYSTEM_URLS = {
    "SHD": "http://183.82.103.80:8011/sap/opu/odata/SAP/ZBSUSERODATA_SRV",
    "EMP": "http://49.206.197.17:8031/sap/opu/odata/SAP/ZBSUSERODATA_SRV",
    "EMQ": "http://49.206.197.17:8033/sap/opu/odata/SAP/ZBSUSERODATA_SRV",
    "EMD": "http://49.206.197.17:8006/sap/opu/odata/SAP/ZBSUSERODATA_SRV",
}

def _normalized_system(doc):
    system_id = (doc.get("system_id") or "").upper()
    return {
        "system_id": system_id,
        "name": SAP_SYSTEM_NAMES.get(system_id, system_id),
        "description": f"{system_id} Development" if system_id else doc.get("description", ""),
        "client": current_app.config.get("SAP_CLIENT", "100"),
        "environment": "Development",
        "url": doc.get("url") or SAP_SYSTEM_URLS.get(system_id, "")
    }

@sap_bp.route("/systems", methods=["GET"])
@jwt_required()
def list_systems():
    """Lists available SAP systems configured in the database or config."""
    db = current_app.db
    cursor = db.sap_systems.find({"is_active": True})
    systems = []
    for doc in cursor:
        if doc.get("system_id") in SAP_SYSTEM_NAMES:
            systems.append(_normalized_system(doc))
    if not systems:
        systems = [_normalized_system({"system_id": sid, "url": url}) for sid, url in SAP_SYSTEM_URLS.items()]
    return jsonify(systems), 200

@sap_bp.route("/user-search", methods=["GET"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin", "Viewer"])
def user_search():
    """Searches users in the selected SAP system."""
    system_id = request.args.get("system_id") or request.headers.get("X-SAP-System")
    username = request.args.get("username")
    email = request.args.get("email")

    if not system_id:
        return jsonify({"error": "Missing parameter", "message": "system_id is required"}), 400

    try:
        results = sap_service.search_users(system_id, username, email)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": "SAP Error", "message": str(e)}), 500

@sap_bp.route("/create-user", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("create_user")
def create_user():
    """Creates a single SAP user."""
    json_data = request.get_json() or {}
    system_id = json_data.get("system_id") or json_data.get("systemId") or request.headers.get("X-SAP-System", "SHD")
    username = (json_data.get("username") or json_data.get("Username") or "").strip()
    last_name = (json_data.get("last_name") or json_data.get("LastName") or "").strip()
    init_password = json_data.get("init_password") or json_data.get("Password") or ""
    valid_from = json_data.get("valid_from") or json_data.get("ValidFrom")
    valid_to = json_data.get("valid_to") or json_data.get("ValidTo")
    
    if not username:
        return jsonify({"error": "Validation Error", "message": "SAP Username is required"}), 400
    if not last_name:
        return jsonify({"error": "Validation Error", "message": "Last Name is required"}), 400
    if not init_password:
        return jsonify({"error": "Validation Error", "message": "Temporary Password is required"}), 400
    if not valid_from or not valid_to:
        return jsonify({"error": "Validation Error", "message": "Valid From and Valid To dates are required"}), 400

    data = {
        "system_id": system_id,
        "username": username,
        "first_name": json_data.get("first_name") or json_data.get("FirstName", ""),
        "last_name": last_name,
        "init_password": init_password,
        "user_type": json_data.get("user_type") or json_data.get("UserType", "Dialog"),
        "email": json_data.get("email") or json_data.get("Email", ""),
        "phone": json_data.get("phone") or json_data.get("MobileNo", ""),
        "valid_from": valid_from,
        "valid_to": valid_to,
        "roles": json_data.get("roles") or json_data.get("Roles") or [],
        "profiles": json_data.get("profiles") or json_data.get("Profiles") or []
    }

    try:
        result = sap_service.create_user(system_id, data)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"error": "SAP OData Failure", "message": str(e)}), 500

@sap_bp.route("/reset-password", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("reset_password")
def reset_password():
    """Resets user password in selected SAP system."""
    json_data = request.get_json() or {}
    system_id = json_data.get("system_id") or json_data.get("systemId") or request.headers.get("X-SAP-System", "SHD")
    username = (json_data.get("username") or json_data.get("Username") or "").strip()
    password = json_data.get("password") or json_data.get("Password") or ""

    if not username:
        return jsonify({"error": "Validation Error", "message": "SAP Username is required"}), 400

    try:
        result = sap_service.reset_password(system_id, username, password)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "SAP OData Failure", "message": str(e)}), 500

@sap_bp.route("/lock", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("lock_user")
def lock_user():
    """Locks a user in the selected SAP system."""
    json_data = request.get_json() or {}
    system_id = json_data.get("system_id") or json_data.get("systemId") or request.headers.get("X-SAP-System", "SHD")
    username = (json_data.get("username") or json_data.get("Username") or "").strip()
    reason = json_data.get("reason") or json_data.get("Reason") or "Locked via BASIS Console"

    if not username:
        return jsonify({"error": "Validation Error", "message": "SAP Username is required"}), 400

    try:
        result = sap_service.lock_user(system_id, username, reason)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "SAP OData Failure", "message": str(e)}), 500

@sap_bp.route("/unlock", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("unlock_user")
def unlock_user():
    """Unlocks a user in the selected SAP system."""
    json_data = request.get_json() or {}
    system_id = json_data.get("system_id") or json_data.get("systemId") or request.headers.get("X-SAP-System", "SHD")
    username = (json_data.get("username") or json_data.get("Username") or "").strip()
    reason = json_data.get("reason") or json_data.get("Reason") or "Wrong Password Attempts"

    if not username:
        return jsonify({"error": "Validation Error", "message": "SAP Username is required"}), 400

    try:
        result = sap_service.unlock_user(system_id, username, reason=reason)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "SAP OData Failure", "message": str(e)}), 500

@sap_bp.route("/assign-role", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("assign_roles")
def assign_roles():
    """Assigns list of roles to SAP user."""
    json_data = request.get_json() or {}
    system_id = json_data.get("system_id") or json_data.get("systemId") or request.headers.get("X-SAP-System", "SHD")
    username = (json_data.get("username") or json_data.get("Username") or "").strip()
    roles = json_data.get("roles") or json_data.get("Roles") or []
    if isinstance(roles, str):
        roles = [r.strip() for r in roles.split(",") if r.strip()]

    if not username:
        return jsonify({"error": "Validation Error", "message": "SAP Username is required"}), 400
    if not roles:
        return jsonify({"error": "Validation Error", "message": "At least one SAP role is required"}), 400

    try:
        result = sap_service.assign_roles(system_id, username, roles)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "SAP OData Failure", "message": str(e)}), 500

@sap_bp.route("/assign-profile", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("assign_profiles")
def assign_profiles():
    """Assigns list of profiles to SAP user."""
    json_data = request.get_json() or {}
    system_id = json_data.get("system_id") or json_data.get("systemId") or request.headers.get("X-SAP-System", "SHD")
    username = (json_data.get("username") or json_data.get("Username") or "").strip()
    profiles = json_data.get("profiles") or json_data.get("Profiles") or []
    if isinstance(profiles, str):
        profiles = [p.strip() for p in profiles.split(",") if p.strip()]

    if not username:
        return jsonify({"error": "Validation Error", "message": "SAP Username is required"}), 400
    if not profiles:
        return jsonify({"error": "Validation Error", "message": "At least one SAP profile is required"}), 400

    try:
        result = sap_service.assign_profiles(system_id, username, profiles)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "SAP OData Failure", "message": str(e)}), 500

@sap_bp.route("/extend-validity", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("extend_validity")
def extend_validity():
    """Extends validity date of SAP user."""
    json_data = request.get_json() or {}
    system_id = json_data.get("system_id") or json_data.get("systemId") or request.headers.get("X-SAP-System", "SHD")
    username = (json_data.get("username") or json_data.get("Username") or "").strip()
    valid_to = json_data.get("valid_to") or json_data.get("ValidTo") or ""
    reason = json_data.get("reason") or json_data.get("Reason") or "Validity Extended via BASIS Console"

    if not username:
        return jsonify({"error": "Validation Error", "message": "SAP Username is required"}), 400
    if not valid_to:
        return jsonify({"error": "Validation Error", "message": "Valid To date is required"}), 400

    try:
        result = sap_service.extend_validity(system_id, username, valid_to, reason)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "SAP OData Failure", "message": str(e)}), 500

@sap_bp.route("/template", methods=["GET"])
@jwt_required()
def download_template():
    """Downloads the standard Excel bulk user creation template."""
    try:
        file_stream = excel_processor.generate_template()
        return send_file(
            file_stream,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="SAP_Bulk_User_Template.xlsx"
        )
    except Exception as e:
        return jsonify({"error": "Internal Error", "message": str(e)}), 500

@sap_bp.route("/bulk-create/preview", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
def bulk_create_preview():
    """Uploads Excel and returns rows validation review before execution."""
    if "file" not in request.files:
        return jsonify({"error": "Missing File", "message": "No Excel template workbook uploaded"}), 400

    excel_file = request.files["file"]
    try:
        records = excel_processor.parse_and_validate_excel(excel_file.stream)
        return jsonify(records), 200
    except Exception as e:
        return jsonify({"error": "Parsing Failure", "message": str(e)}), 400

@sap_bp.route("/bulk-create/process", methods=["POST"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
@audit_action("bulk_create")
def bulk_create_process():
    """Executes provisionings sequentially and generates download reports."""
    json_data = request.get_json()
    if not json_data or "system_id" not in json_data or "users" not in json_data:
        return jsonify({"error": "Bad Request", "message": "system_id and users list are required"}), 400

    system_id = json_data["system_id"]
    users = json_data["users"]
    
    results = []
    db = current_app.db

    valid_users_data = []
    valid_indices = []

    for idx, user in enumerate(users):
        errors = user.get("errors", [])
        if not user.get("is_valid", True) or errors:
            results.append({
                "status": "Failed",
                "message": f"Pre-validation error: {', '.join(errors)}"
            })
        else:
            # Reformat dates if necessary
            user_data = {
                "username": user.get("username", ""),
                "first_name": user.get("first_name", user.get("FirstName", "")),
                "last_name": user.get("last_name", user.get("LastName", "")),
                "email": user.get("email", user.get("Email", "")),
                "department": user.get("department", ""),
                "company": user.get("company", ""),
                "user_type": user.get("user_type", "A"),
                "init_password": user.get("init_password", user.get("Password", "")),
                "valid_from": user.get("valid_from"),
                "valid_to": user.get("valid_to"),
                "language": user.get("language", "EN"),
                "profiles": user.get("profiles", []),
                "roles": user.get("roles", []),
                "employee_id": user.get("employee_id", ""),
                "phone": user.get("phone", ""),
                "cost_center": user.get("cost_center", ""),
                "manager": user.get("manager", "")
            }
            valid_users_data.append(user_data)
            valid_indices.append(idx)
            results.append(None)

    if valid_users_data:
        try:
            bulk_res = sap_service.create_users_bulk(system_id, valid_users_data)
            for idx, res in zip(valid_indices, bulk_res):
                if res.get("status") == "Success":
                    results[idx] = {"status": "Success", "message": "User created successfully in SAP"}
                else:
                    results[idx] = {"status": "Failed", "message": res.get("message", "OData creation failed")}
        except Exception as e:
            for idx in valid_indices:
                results[idx] = {"status": "Failed", "message": str(e)}

    # Generate processing workbook and upload it to mongo
    try:
        report_stream = excel_processor.generate_processing_report(users, results)
        report_id = str(uuid.uuid4())
        
        # Save to database
        db.uploaded_files.insert_one({
            "report_id": report_id,
            "system_id": system_id,
            "created_at": datetime.utcnow(),
            "file_data": report_stream.getvalue()
        })
        
        return jsonify({
            "message": "Bulk execution complete.",
            "report_id": report_id,
            "results": results
        }), 200

    except Exception as e:
        return jsonify({"error": "Report Generation Failure", "message": str(e)}), 500

@sap_bp.route("/bulk-create/report/<report_id>", methods=["GET"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
def download_report(report_id):
    """Downloads the processed execution report."""
    db = current_app.db
    doc = db.uploaded_files.find_one({"report_id": report_id})
    if not doc:
        return jsonify({"error": "Not Found", "message": "Report not found or expired"}), 404

    file_stream = io.BytesIO(doc["file_data"])
    return send_file(
        file_stream,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"SAP_Bulk_Create_Report_{report_id[:8]}.xlsx"
    )
