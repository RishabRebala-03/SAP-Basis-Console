class SAPSystem:
    def __init__(self, system_id, name, description, client, url, user, password, is_active=True):
        self.system_id = system_id  # e.g., SHD, EMP
        self.name = name
        self.description = description
        self.client = client
        self.url = url
        self.user = user
        self.password = password
        self.is_active = is_active

    def to_dict(self):
        return {
            "system_id": self.system_id,
            "name": self.name,
            "description": self.description,
            "client": self.client,
            "url": self.url,
            "user": self.user,
            "password": self.password,  # Note: in real production, encrypt this
            "is_active": self.is_active
        }

    @staticmethod
    def from_dict(data):
        if not data:
            return None
        return SAPSystem(
            system_id=data.get("system_id"),
            name=data.get("name"),
            description=data.get("description"),
            client=data.get("client"),
            url=data.get("url"),
            user=data.get("user"),
            password=data.get("password"),
            is_active=data.get("is_active", True)
        )
