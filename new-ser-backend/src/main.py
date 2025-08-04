from flask import Flask, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import os
import traceback

# Initialize extensions outside of create_app for global access
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///site.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Session configuration
    app.config["SESSION_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    
    # More detailed CORS configuration
    CORS(app, 
         supports_credentials=True,
         origins=["*"],  # Allow all origins temporarily to fix CORS issues
         allow_headers=["Content-Type", "Authorization", "Cookie"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         expose_headers=["Set-Cookie"])

    # Import models after db initialization and create User model
    from src.models.user import create_user_model
    User = create_user_model(db)

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Global exception handler to ensure all responses are JSON"""
        # Pass through HTTP errors
        if isinstance(e, HTTPException):
            return jsonify({"error": e.description}), e.code
        
        # Log the error for debugging
        app.logger.error(f"Unhandled exception: {str(e)}")
        app.logger.error(traceback.format_exc())
        
        # Return JSON error response
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

    # Import and register blueprints AFTER defining error handlers
    from src.routes.auth import create_auth_blueprint
    from src.routes.upload import upload_bp # Import the new upload blueprint
    from src.routes.chat import create_chat_blueprint # Import the chat blueprint

    auth_bp = create_auth_blueprint(db, User)
    chat_bp = create_chat_blueprint(db, User)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(upload_bp, url_prefix="/api/upload") # Register the upload blueprint
    app.register_blueprint(chat_bp, url_prefix="/chat") # Register the chat blueprint

    # Create tables
    with app.app_context():
        db.create_all()

    @app.route("/")
    def home():
        return jsonify(message="Welcome to the new backend API!")

    @app.route("/health")
    def health():
        return jsonify(status="healthy", message="Backend is running")

    # Serve uploaded files
    @app.route("/uploads/<filename>")
    def uploaded_file(filename):
        return send_from_directory("uploads", filename)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)



