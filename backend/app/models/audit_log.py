from datetime import datetime

class AuditLog:
    def __init__(self, username, sap_system, action, payload, response, status, duration, ip_address, timestamp=None):
        self.timestamp = timestamp or datetime.utcnow()
        self.username = username
        self.sap_system = sap_system
        self.action = action
        self.payload = payload
        self.response = response
        self.status = status  # "Success" or "Failed"
        self.duration = duration  # in seconds (float)
        self.ip_address = ip_address

    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "username": self.username,
            "sap_system": self.sap_system,
            "action": self.action,
            "payload": self.payload,
            "response": self.response,
            "status": self.status,
            "duration": self.duration,
            "ip_address": self.ip_address
        }

    @staticmethod
    def from_dict(data):
        if not data:
            return None
        return AuditLog(
            timestamp=data.get("timestamp"),
            username=data.get("username"),
            sap_system=data.get("sap_system"),
            action=data.get("action"),
            payload=data.get("payload"),
            response=data.get("response"),
            status=data.get("status"),
            duration=data.get("duration"),
            ip_address=data.get("ip_address")
        )
