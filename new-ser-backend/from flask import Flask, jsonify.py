from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/api/auth/me')
def auth_me():
    # For testing, return a dummy user profile
    return jsonify({"profile": {"name": "Test User", "email": "test@example.com"}})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
