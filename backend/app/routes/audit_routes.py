from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from datetime import datetime
import pandas as pd
import io

from backend.app.repositories.audit_repository import AuditRepository
from backend.app.middleware.security import role_required

audit_routes_bp = Blueprint("audit_routes", __name__)
audit_repo = AuditRepository()

@audit_routes_bp.route("/audit", methods=["GET"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
def get_audit_logs():
    """Gets paginated and filtered console audit logs."""
    username = request.args.get("username")
    sap_system = request.args.get("sap_system")
    action = request.args.get("action")
    status = request.args.get("status")
    
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    
    start_date = None
    end_date = None
    
    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        if end_date_str:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Bad Request", "message": "Date parameters must be formatted as YYYY-MM-DD"}), 400

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)

    try:
        logs, total = audit_repo.get_filtered_logs(
            start_date=start_date,
            end_date=end_date,
            action=action,
            status=status,
            username=username,
            sap_system=sap_system,
            page=page,
            limit=limit
        )
        return jsonify({
            "logs": logs,
            "total": total,
            "page": page,
            "limit": limit
        }), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "message": str(e)}), 500

@audit_routes_bp.route("/activity", methods=["GET"])
@jwt_required()
@role_required(["Super Admin", "Basis Admin"])
def get_activity_history():
    """Retrieves full/filtered history. If format=csv is queried, downloads a CSV file."""
    username = request.args.get("username")
    sap_system = request.args.get("sap_system")
    action = request.args.get("action")
    status = request.args.get("status")
    
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    
    start_date = None
    end_date = None
    
    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        if end_date_str:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Bad Request", "message": "Date format must be YYYY-MM-DD"}), 400

    download_csv = request.args.get("format", "").lower() == "csv"
    
    # If downloading, load all records (limit=5000 max), otherwise load first page
    limit = 5000 if download_csv else 100
    
    try:
        logs, total = audit_repo.get_filtered_logs(
            start_date=start_date,
            end_date=end_date,
            action=action,
            status=status,
            username=username,
            sap_system=sap_system,
            page=1,
            limit=limit
        )

        if download_csv:
            # Flatten logs for CSV export
            flat_logs = []
            for log in logs:
                flat_logs.append({
                    "Timestamp": log.get("timestamp"),
                    "Operator Username": log.get("username"),
                    "SAP System": log.get("sap_system"),
                    "Action": log.get("action"),
                    "Status": log.get("status"),
                    "Duration (s)": log.get("duration"),
                    "IP Address": log.get("ip_address"),
                    "Target Username": log.get("payload", {}).get("username") or log.get("payload", {}).get("UserName", "")
                })
            
            df = pd.DataFrame(flat_logs)
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            
            return Response(
                csv_buffer.getvalue(),
                mimetype="text/csv",
                headers={"Content-disposition": "attachment; filename=SAP_Basis_Activity_Log.csv"}
            )
        else:
            return jsonify({
                "logs": logs,
                "total": total
            }), 200

    except Exception as e:
        return jsonify({"error": "Database Error", "message": str(e)}), 500
