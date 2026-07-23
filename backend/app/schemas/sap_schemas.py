from marshmallow import Schema, fields, validate, EXCLUDE

class BaseSAPSchema(Schema):
    class Meta:
        unknown = EXCLUDE

class CreateUserSchema(BaseSAPSchema):
    system_id = fields.Str(required=False)
    systemId = fields.Str(required=False)
    username = fields.Str(
        required=True, 
        validate=[
            validate.Length(min=1, max=12),
            validate.Regexp(r"^[A-Z0-9_]+$", error="SAP Username must only contain uppercase letters, numbers, and underscores")
        ]
    )
    last_name = fields.Str(required=False, validate=validate.Length(min=0, max=40), load_default="")
    init_password = fields.Str(required=False, load_default="")
    valid_from = fields.Date(required=False, allow_none=True)
    valid_to = fields.Date(required=False, allow_none=True)
    profiles = fields.List(fields.Str(), load_default=list)
    roles = fields.List(fields.Str(), load_default=list)

class ResetSAPPasswordSchema(BaseSAPSchema):
    system_id = fields.Str(required=False)
    systemId = fields.Str(required=False)
    username = fields.Str(required=True)
    password = fields.Str(required=False, load_default="")

class LockUserSchema(BaseSAPSchema):
    system_id = fields.Str(required=False)
    systemId = fields.Str(required=False)
    username = fields.Str(required=True)
    reason = fields.Str(required=False, load_default="Locked via BASIS Console", validate=validate.Length(min=0, max=100))

class UnlockUserSchema(BaseSAPSchema):
    system_id = fields.Str(required=False)
    systemId = fields.Str(required=False)
    username = fields.Str(required=True)

class AssignRolesSchema(BaseSAPSchema):
    system_id = fields.Str(required=False)
    systemId = fields.Str(required=False)
    username = fields.Str(required=True)
    roles = fields.List(fields.Str(), required=False, load_default=list)

class AssignProfilesSchema(BaseSAPSchema):
    system_id = fields.Str(required=False)
    systemId = fields.Str(required=False)
    username = fields.Str(required=True)
    profiles = fields.List(fields.Str(), required=False, load_default=list)

class ExtendValiditySchema(BaseSAPSchema):
    system_id = fields.Str(required=False)
    systemId = fields.Str(required=False)
    username = fields.Str(required=True)
    valid_to = fields.Date(required=True)
    reason = fields.Str(required=False, load_default="Validity Extended via BASIS Console", validate=validate.Length(min=0, max=100))

