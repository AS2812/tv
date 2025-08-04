from flask import Blueprint, request, jsonify, session
import os
import uuid

upload_bp = Blueprint("upload", __name__)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("/upload-avatar", methods=["POST"])
def upload_avatar():
    try:
        # التحقق من تسجيل دخول المستخدم
        if "user_id" not in session:
            return jsonify({"error": "User not logged in"}), 401

        # التحقق من وجود المستخدم في قاعدة البيانات
        # Import User model from main app context
        from src.main import db
        from src.models.user import create_user_model
        User = create_user_model(db)
        
        user_id = session["user_id"]
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        if "avatar" not in request.files:
            return jsonify({"error": "No avatar file part"}), 400

        file = request.files["avatar"]

        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        if file and allowed_file(file.filename):
            # إضافة معرف المستخدم إلى اسم الملف لضمان الفرادة
            filename = f"{user_id}_{str(uuid.uuid4())}.{file.filename.rsplit('.', 1)[1].lower()}"
            
            # Ensure the upload folder exists
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)

            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)

            # Return the full URL of the uploaded file
            # Get the base URL from the request
            base_url = request.url_root.rstrip('/')
            avatar_url = f"{base_url}/uploads/{filename}"
            return jsonify({"avatar_url": avatar_url}), 200
        else:
            return jsonify({"error": "File type not allowed"}), 400

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


