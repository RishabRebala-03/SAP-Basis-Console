from flask import Flask, jsonify
from flask_cors import CORS
from marshmallow import ValidationError
import logging

from backend.app.config.config import Config
from backend.app.extensions.extensions import jwt, limiter, mongo
from backend.app.utils.custom_logger import setup_logger
from backend.app.auth.auth_routes import auth_bp
from backend.app.routes.sap_routes import sap_bp
from backend.app.routes.dashboard_routes import dashboard_bp
from backend.app.routes.audit_routes import audit_routes_bp

logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    jwt.init_app(app)
    limiter.init_app(app)
    mongo.init_app(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Unauthorized", "message": "Token has expired"}), 401

    # Setup Logging
    setup_logger(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(sap_bp, url_prefix="/api/sap")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(audit_routes_bp, url_prefix="/api")

    # Centralized Error Handlers
    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        return jsonify({"error": "Validation Error", "messages": e.messages}), 400

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e.description)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "message": "You do not have permission to access this resource"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": "Resource not found"}), 404

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({"error": "Too Many Requests", "message": "API rate limit exceeded. Please try again later."}), 429

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass HTTPExceptions through
        if hasattr(e, "code"):
            return jsonify({"error": getattr(e, "name", "HTTP Exception"), "message": getattr(e, "description", str(e))}), e.code
        
        # Log unhandled exceptions
        app.logger.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal Server Error",
            "message": str(e) or "An unexpected error occurred in backend operation."
        }), 500

    return app
