from flask import current_app
from datetime import datetime, time
from backend.app.models.audit_log import AuditLog

class AuditRepository:
    def __init__(self):
        pass

    @property
    def db(self):
        return current_app.db

    def insert_log(self, audit_log):
        self.db.audit_logs.insert_one(audit_log.to_dict())

    def get_filtered_logs(self, start_date=None, end_date=None, action=None, status=None, username=None, sap_system=None, page=1, limit=50):
        query = {}

        if start_date or end_date:
            date_filter = {}
            if start_date:
                # parsed date
                date_filter["$gte"] = datetime.combine(start_date, time.min)
            if end_date:
                date_filter["$lte"] = datetime.combine(end_date, time.max)
            query["timestamp"] = date_filter

        if action:
            query["action"] = action
        if status:
            query["status"] = status
        if username:
            query["username"] = {"$regex": username, "$options": "i"}
        if sap_system:
            query["sap_system"] = sap_system

        total = self.db.audit_logs.count_documents(query)
        
        # Paginate
        skip = (page - 1) * limit
        cursor = self.db.audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        
        logs = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
                doc["timestamp"] = doc["timestamp"].isoformat()
            logs.append(doc)
            
        return logs, total

    def get_dashboard_stats(self):
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)

        # 1. Today's Requests
        today_query = {"timestamp": {"$gte": today_start}}
        today_requests = self.db.audit_logs.count_documents(today_query)

        # 2. Total Requests ever
        total_requests = self.db.audit_logs.count_documents({})

        # 3. Successful vs Failed
        success_requests = self.db.audit_logs.count_documents({"status": "Success"})
        failed_requests = self.db.audit_logs.count_documents({"status": "Failed"})

        # 4. Total SAP Users Managed (distinct usernames impacted by create/reset/lock/unlock actions)
        pipeline = [
            {"$match": {"action": {"$in": ["create_user", "bulk_create", "reset_password", "lock_user", "unlock_user", "assign_roles", "assign_profiles", "extend_validity"]}}},
            {"$group": {"_id": "$payload.username"}}
        ]
        distinct_sap_users = len(list(self.db.audit_logs.aggregate(pipeline)))

        # 5. Recent Activities
        recent_cursor = self.db.audit_logs.find({}).sort("timestamp", -1).limit(10)
        recent_activities = []
        for doc in recent_cursor:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
                doc["timestamp"] = doc["timestamp"].isoformat()
            recent_activities.append(doc)

        # 6. Chart data: last 7 days aggregation (Requests, Successes, Failures)
        # Using aggregation for daily stats
        chart_pipeline = [
            {
                "$match": {
                    "timestamp": {
                        "$gte": datetime.utcnow() - timedelta_days(7)
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": { "$dateToString": { "format": "%Y-%m-%d", "date": "$timestamp" } },
                        "status": "$status"
                    },
                    "count": { "$sum": 1 }
                }
            }
        ]
        
        # Since we might need timedelta, let's import it locally inside the method
        return {
            "total_users_managed": distinct_sap_users if distinct_sap_users > 0 else 0,
            "today_requests": today_requests,
            "total_requests": total_requests,
            "success_requests": success_requests,
            "failed_requests": failed_requests,
            "recent_activities": recent_activities
        }
    
    def get_daily_chart_stats(self, days=7):
        from datetime import timedelta
        now = datetime.utcnow()
        start_date = datetime(now.year, now.month, now.day) - timedelta(days=days-1)
        
        pipeline = [
            {"$match": {"timestamp": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                        "status": "$status"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = list(self.db.audit_logs.aggregate(pipeline))
        
        # Structure by date
        daily_stats = {}
        for i in range(days):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_stats[d] = {"date": d, "success": 0, "failed": 0, "total": 0}
            
        for r in results:
            date_str = r["_id"]["date"]
            status = r["_id"]["status"].lower()
            count = r["count"]
            if date_str in daily_stats:
                if status == "success":
                    daily_stats[date_str]["success"] += count
                else:
                    daily_stats[date_str]["failed"] += count
                daily_stats[date_str]["total"] += count
                
        return sorted(list(daily_stats.values()), key=lambda x: x["date"])

def timedelta_days(n):
    from datetime import timedelta
    return timedelta(days=n)
