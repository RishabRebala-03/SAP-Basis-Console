from marshmallow import Schema, fields, validate

class LoginSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    password = fields.Str(required=True, validate=validate.Length(min=6))

class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)

class ResetPasswordSchema(Schema):
    token = fields.Str(required=True)
    new_password = fields.Str(
        required=True, 
        validate=[
            validate.Length(min=8, error="Password must be at least 8 characters long"),
            validate.Regexp(
                r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
                error="Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            )
        ]
    )
