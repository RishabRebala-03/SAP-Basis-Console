from werkzeug.security import generate_password_hash, check_password_hash

class User:
    def __init__(self, username, email, role, password=None, is_active=True, id=None):
        self.id = id
        self.username = username
        self.email = email
        self.role = role  # Super Admin, Basis Admin, Viewer
        self.is_active = is_active
        if password:
            self.password_hash = generate_password_hash(password)
        else:
            self.password_hash = None

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "password_hash": self.password_hash,
            "is_active": self.is_active
        }

    @staticmethod
    def from_dict(data):
        if not data:
            return None
        user = User(
            username=data.get("username"),
            email=data.get("email"),
            role=data.get("role"),
            is_active=data.get("is_active", True),
            id=str(data.get("_id")) if "_id" in data else None
        )
        user.password_hash = data.get("password_hash")
        return user
