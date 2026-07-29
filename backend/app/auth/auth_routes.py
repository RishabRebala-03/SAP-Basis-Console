from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token, 
    jwt_required, 
    get_jwt_identity, 
    get_jwt
)
from datetime import datetime, timedelta
import uuid
import logging

from backend.app.repositories.user_repository import UserRepository
from backend.app.schemas.auth_schemas import LoginSchema, ForgotPasswordSchema, ResetPasswordSchema
from backend.app.models.user import User

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)
user_repo = UserRepository()

@auth_bp.route("/login", methods=["POST"])
def login():
    """Logs in an administrator and issues access + refresh JWTs."""
    json_data = request.get_json()
    schema = LoginSchema()
    errors = schema.validate(json_data)
    if errors:
        return jsonify({"error": "Validation Error", "messages": errors}), 400

    username = json_data["username"].strip()
    password = json_data["password"]

    user = user_repo.find_by_username(username)
    if not user or not user.check_password(password):
        return jsonify({"error": "Unauthorized", "message": "Invalid username or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Forbidden", "message": "User account is suspended"}), 403

    # Issue tokens
    access_token = create_access_token(identity=user.username, additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=user.username)

    # Register active session in Mongo
    expires_at = datetime.utcnow() + timedelta(days=7)
    user_repo.register_session(
        username=user.username,
        refresh_token=refresh_token,
        ip_address=request.remote_addr or "Unavailable",
        expires_at=expires_at
    )

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }), 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logs out current administrator and revokes session tokens."""
    # Revoke session via refresh token (typically sent in payload)
    json_data = request.get_json() or {}
    refresh_token = json_data.get("refresh_token")
    if refresh_token:
        user_repo.revoke_session(refresh_token)
    
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refreshes access tokens via a valid refresh token."""
    username = get_jwt_identity()
    refresh_token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    
    if not user_repo.is_session_valid(username, refresh_token):
        return jsonify({"error": "Unauthorized", "message": "Session is invalid or expired"}), 401

    user = user_repo.find_by_username(username)
    if not user or not user.is_active:
        return jsonify({"error": "Forbidden", "message": "User is suspended or deleted"}), 403

    new_access_token = create_access_token(identity=user.username, additional_claims={"role": user.role})
    return jsonify({"access_token": new_access_token}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Simulates a forgot-password routine, generating an OTP/Reset token."""
    json_data = request.get_json()
    schema = ForgotPasswordSchema()
    errors = schema.validate(json_data)
    if errors:
        return jsonify({"error": "Validation Error", "messages": errors}), 400

    email = json_data["email"]
    user = user_repo.find_by_email(email)
    
    if not user:
        # Avoid user enumeration - return success anyway
        return jsonify({"message": "If the email is registered, a reset link will be sent shortly."}), 200

    # Generate token
    reset_token = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    # Store token in user record
    user_data = user.to_dict()
    user_data["reset_token"] = reset_token
    user_data["reset_token_expiry"] = expiry
    
    user_repo.db.users.update_one(
        {"username": user.username},
        {"$set": {"reset_token": reset_token, "reset_token_expiry": expiry}}
    )

    logger.info(f"Generated password reset link for user {user.username}: {reset_token}")
    
    # Return token directly for mock/dev purposes
    return jsonify({
        "message": "Reset link generated successfully.",
        "dev_reset_token": reset_token  # Provided to allow verification without mail server
    }), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Applies the new password if a valid reset token is presented."""
    json_data = request.get_json()
    schema = ResetPasswordSchema()
    errors = schema.validate(json_data)
    if errors:
        return jsonify({"error": "Validation Error", "messages": errors}), 400

    token = json_data["token"]
    new_password = json_data["new_password"]

    user_record = user_repo.db.users.find_one({
        "reset_token": token,
        "reset_token_expiry": {"$gt": datetime.utcnow()}
    })
    
    if not user_record:
        return jsonify({"error": "Invalid Token", "message": "Reset token is invalid or expired."}), 400

    user = User.from_dict(user_record)
    user.password_hash = User(user.username, user.email, user.role, password=new_password).password_hash
    
    # Update password and clear reset tokens
    user_repo.db.users.update_one(
        {"username": user.username},
        {
            "$set": {"password_hash": user.password_hash},
            "$unset": {"reset_token": "", "reset_token_expiry": ""}
        }
    )

    return jsonify({"message": "Password reset successfully. You can now login with your new credentials."}), 200
