from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

def create_auth_blueprint(db, User):
    auth_bp = Blueprint("auth", __name__)

    @auth_bp.route("/register", methods=["POST"])
    def register():
        try:
            print("Starting user registration...")
            
            data = request.get_json()
            if not data:
                print("No data provided")
                return jsonify({"error": "No data provided"}), 400
                
            username = data.get("username")
            password = data.get("password")
            display_name = data.get("display_name", "")
            
            print(f"Registration attempt for username: {username}")
            
            if not username or not password:
                print("Missing username or password")
                return jsonify({"error": "Username and password are required"}), 400
            
            # Check if username already exists
            print("Checking if username exists...")
            existing_user = User.query.filter_by(username=username).first()
            if existing_user:
                print(f"Username {username} already exists")
                return jsonify({"error": "Username already exists"}), 400
            
            # Create new user
            print("Creating new user...")
            password_hash = generate_password_hash(password)
            new_user = User(
                username=username,
                password_hash=password_hash,
                display_name=display_name,
                created_at=datetime.utcnow(),
                last_active=datetime.utcnow()
            )
            
            print(f"Adding user to database with ID: {new_user.id}")
            db.session.add(new_user)
            db.session.commit()
            print("User committed to database successfully")
            
            # Set session
            session["user_id"] = new_user.id
            session["username"] = new_user.username
            print(f"Session set for user: {new_user.id}")
            
            return jsonify({
                "message": "User registered successfully",
                "user": new_user.to_dict(),
                "redirect": "/complete-profile"
            }), 201
            
        except Exception as e:
            print(f"Registration error: {str(e)}")
            db.session.rollback()
            return jsonify({"error": f"Registration failed: {str(e)}"}), 500

    @auth_bp.route("/login", methods=["POST"])
    def login():
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
                
            username = data.get("username")
            password = data.get("password")
            
            if not username or not password:
                return jsonify({"error": "Username and password are required"}), 400
            
            user = User.query.filter_by(username=username).first()
            
            if not user or not check_password_hash(user.password_hash, password):
                return jsonify({"error": "Invalid username or password"}), 401
            
            # Update last active
            user.last_active = datetime.utcnow()
            db.session.commit()
            
            # Set session
            session["user_id"] = user.id
            session["username"] = user.username
            
            if not user.profile_completed:
                return jsonify({
                    "message": "Login successful",
                    "user": user.to_dict(),
                    "redirect": "/complete-profile"
                }), 200
            else:
                return jsonify({
                    "message": "Login successful",
                    "user": user.to_dict(),
                    "redirect": "/dashboard"
                }), 200
                
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Login failed: {str(e)}"}), 500

    @auth_bp.route("/complete-profile", methods=["POST"])
    def complete_profile():
        try:
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401
            
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
                
            user = User.query.get(session["user_id"])
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Update user profile - accept both fullName and display_name for compatibility
            display_name = data.get("fullName") or data.get("display_name")
            if display_name:
                user.display_name = display_name
            
            gender = data.get("gender")
            if gender:
                user.gender = gender
                
            avatar_url = data.get("avatar_url")
            if avatar_url:
                user.avatar_url = avatar_url
                
            user.profile_completed = True
            
            db.session.commit()
            
            return jsonify({
                "message": "Profile completed successfully",
                "user": user.to_dict(),
                "redirect": "/dashboard"
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    @auth_bp.route("/logout", methods=["POST"])
    def logout():
        try:
            session.clear()
            return jsonify({"message": "Logged out successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @auth_bp.route("/me", methods=["GET"])
    def get_current_user():
        try:
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401
            
            user = User.query.get(session["user_id"])
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            return jsonify({"user": user.to_dict()}), 200
            
        except Exception as e:
            return jsonify({"error": f"Failed to get user: {str(e)}"}), 500

    @auth_bp.route("/met-users", methods=["GET"])
    def get_met_users():
        try:
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401
            
            # For now, return empty list - this can be expanded later
            return jsonify({"met_users": []}), 200
            
        except Exception as e:
            return jsonify({"error": f"Failed to get met users: {str(e)}"}), 500

    @auth_bp.route("/reconnect-requests", methods=["GET"])
    def get_reconnect_requests():
        try:
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401
            
            # For now, return empty list - this can be expanded later
            return jsonify({"reconnect_requests": []}), 200
            
        except Exception as e:
            return jsonify({"error": f"Failed to get reconnect requests: {str(e)}"}), 500

    @auth_bp.route("/update-profile", methods=["PUT"])
    def update_profile():
        try:
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401

            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400

            user_id = session["user_id"]
            user = User.query.get(user_id)

            if not user:
                # إضافة معلومات تشخيصية أكثر
                return jsonify({
                    "error": "User not found", 
                    "debug_info": {
                        "session_user_id": user_id,
                        "session_keys": list(session.keys())
                    }
                }), 404

            # تسجيل محاولة التحديث للتشخيص
            print(f"Updating profile for user {user_id}: {data}")

            display_name = data.get("fullName") or data.get("display_name")
            if display_name:
                user.display_name = display_name

            gender = data.get("gender")
            if gender:
                user.gender = gender
                
            avatar_url = data.get("avatar_url")
            if avatar_url:
                user.avatar_url = avatar_url

            db.session.commit()

            return jsonify({
                "message": "Profile updated successfully",
                "user": user.to_dict()
            }), 200

        except Exception as e:
            db.session.rollback()
            print(f"Error updating profile: {str(e)}")
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    return auth_bp

