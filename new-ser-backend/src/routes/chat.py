from flask import Blueprint, request, jsonify, session
import random
import time

def create_chat_blueprint(db, User):
    chat_bp = Blueprint("chat", __name__)

    @chat_bp.route("/start-session", methods=["POST"])
    def start_chat_session():
        try:
            # التحقق من تسجيل دخول المستخدم
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401

            # التحقق من وجود المستخدم في قاعدة البيانات
            user_id = session["user_id"]
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # محاكاة بدء جلسة الدردشة
            # في التطبيق الحقيقي، هذا سيكون أكثر تعقيداً
            # محاكاة العثور على شريك بعد 3 ثوانٍ

            
            partner_id = str(random.randint(1000, 9999))
            partner_display_name = random.choice(["سارة", "محمد", "فاطمة", "علي"])
            partner_gender = random.choice(["male", "female"])

            return jsonify({
                "status": "connected",
                "message": "Partner found!",
                "partner": {
                    "id": partner_id,
                    "display_name": partner_display_name,
                    "avatar_url": None, # يمكنك إضافة رابط صورة هنا
                    "gender": partner_gender
                }
            }), 200

        except Exception as e:
            return jsonify({"error": f"Failed to start chat session: {str(e)}"}), 500

    @chat_bp.route("/end-session", methods=["POST"])
    def end_chat_session():
        try:
            # التحقق من تسجيل دخول المستخدم
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401

            # التحقق من وجود المستخدم في قاعدة البيانات
            user_id = session["user_id"]
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # محاكاة إنهاء جلسة الدردشة
            if "chat_partner_id" in session:
                session.pop("chat_partner_id")
            if "chat_partner_display_name" in session:
                session.pop("chat_partner_display_name")
            if "chat_partner_gender" in session:
                session.pop("chat_partner_gender")
            
            return jsonify({
                "status": "ended",
                "message": "Chat session ended successfully"
            }), 200

        except Exception as e:
            return jsonify({"error": f"Failed to end chat session: {str(e)}"}), 500

    @chat_bp.route("/session-status", methods=["GET"])
    def get_session_status():
        try:
            # التحقق من تسجيل دخول المستخدم
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401

            # التحقق من وجود المستخدم في قاعدة البيانات
            user_id = session["user_id"]
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # محاكاة حالة الجلسة
            # في التطبيق الحقيقي، هذا سيتم جلبه من قاعدة البيانات
            # إذا كان هناك شريك في الجلسة (محاكاة)
            if "chat_partner_id" in session:
                partner_id = session["chat_partner_id"]
                partner_display_name = session["chat_partner_display_name"]
                partner_gender = session["chat_partner_gender"]
                return jsonify({
                    "status": "connected",
                    "partner": {
                        "id": partner_id,
                        "display_name": partner_display_name,
                        "avatar_url": None,
                        "gender": partner_gender
                    }
                }), 200
            else:
                return jsonify({
                    "status": "none",
                    "partner": None
                }), 200

        except Exception as e:
            return jsonify({"error": f"Failed to get session status: {str(e)}"}), 500

    @chat_bp.route("/report", methods=["POST"])
    def report_user():
        try:
            # التحقق من تسجيل دخول المستخدم
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401

            # التحقق من وجود المستخدم في قاعدة البيانات
            user_id = session["user_id"]
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400

            # محاكاة حفظ التقرير
            return jsonify({
                "message": "Report submitted successfully"
            }), 200

        except Exception as e:
            return jsonify({"error": f"Failed to submit report: {str(e)}"}), 500

    @chat_bp.route("/stats", methods=["GET"])
    def get_chat_stats():
        try:
            # التحقق من تسجيل دخول المستخدم
            if "user_id" not in session:
                return jsonify({"error": "User not logged in"}), 401

            # التحقق من وجود المستخدم في قاعدة البيانات
            user_id = session["user_id"]
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # محاكاة إحصائيات الدردشة
            return jsonify({
                "total_chats": random.randint(10, 100),
                "total_time": random.randint(3600, 36000),
                "average_duration": random.randint(300, 1800)
            }), 200

        except Exception as e:
            return jsonify({"error": f"Failed to get chat stats: {str(e)}"}), 500

    return chat_bp

