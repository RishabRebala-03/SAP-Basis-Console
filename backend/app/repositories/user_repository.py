from flask import current_app
from datetime import datetime
from backend.app.models.user import User

class UserRepository:
    def __init__(self):
        pass

    @property
    def db(self):
        return current_app.db

    def find_by_username(self, username):
        data = self.db.users.find_one({"username": username})
        return User.from_dict(data) if data else None

    def find_by_email(self, email):
        data = self.db.users.find_one({"email": email})
        return User.from_dict(data) if data else None

    def create_user(self, user):
        user_dict = user.to_dict()
        self.db.users.insert_one(user_dict)
        return user

    def update_user(self, user):
        self.db.users.update_one(
            {"username": user.username},
            {"$set": user.to_dict()}
        )
        return user

    def register_session(self, username, refresh_token, ip_address, expires_at):
        self.db.sessions.insert_one({
            "username": username,
            "refresh_token": refresh_token,
            "ip_address": ip_address,
            "expires_at": expires_at,
            "is_revoked": False,
            "created_at": datetime.utcnow()
        })

    def is_session_valid(self, username, refresh_token):
        session = self.db.sessions.find_one({
            "username": username,
            "refresh_token": refresh_token,
            "is_revoked": False
        })
        if not session:
            return False
        # Check expiry
        if session.get("expires_at") < datetime.utcnow():
            return False
        return True

    def revoke_session(self, refresh_token):
        self.db.sessions.update_one(
            {"refresh_token": refresh_token},
            {"$set": {"is_revoked": True}}
        )
