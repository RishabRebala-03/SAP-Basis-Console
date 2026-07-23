from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from backend.app.repositories.audit_repository import AuditRepository

dashboard_bp = Blueprint("dashboard", __name__)
audit_repo = AuditRepository()

@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Gets dashboard counters: total users, today's count, success/fail ratios, and recent logs."""
    try:
        stats = audit_repo.get_dashboard_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "message": str(e)}), 500

@dashboard_bp.route("/chart", methods=["GET"])
@jwt_required()
def get_chart_data():
    """Gets aggregated requests counter data grouped by date for charts."""
    try:
        data = audit_repo.get_daily_chart_stats(days=7)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Database Error", "message": str(e)}), 500
