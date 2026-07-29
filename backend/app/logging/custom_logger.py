import os
import logging
from logging.handlers import RotatingFileHandler

def setup_logger(app):
    """Sets up unified logging for the Flask application."""
    log_level = logging.DEBUG if app.config.get("FLASK_ENV") == "development" else logging.INFO
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(app.root_path, "..", "logs")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_format = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s [%(pathname)s:%(lineno)d]: %(message)s'
    )

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)
    console_handler.setLevel(log_level)

    # File Handler
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, "sap_basis_console.log"),
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(log_format)
    file_handler.setLevel(log_level)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove default handlers to avoid double logging
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    app.logger.info("Application logging initialized.")
