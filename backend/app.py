from flask import Flask, request, jsonify, session
from flask_cors import CORS
from database import db, init_db, UserAdminDetails, HealthData, Feedback
from sqlalchemy.exc import SQLAlchemyError
import os
import logging
import traceback
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure app
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'healthassistant')
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_DOMAIN'] = None

# Configure CORS
CORS(app, 
    resources={
        r"/health_assistant/*": {  # Specific to health_assistant routes
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Accept"],
            "supports_credentials": True,
            "expose_headers": ["Access-Control-Allow-Origin"],
            "max_age": 3600
        }
    })

# Initialize database
try:
    init_db(app)
except Exception as e:
    logger.error(f"Failed to initialize database: {str(e)}")
    raise

@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Server is running"}), 200

@app.route("/health_assistant/ping", methods=["GET", "OPTIONS"])
def ping():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    return jsonify({"message": "pong"}), 200

@app.route("/health_assistant/test", methods=["GET"])
def test_connection():
    """Test endpoint to verify server is running and database is connected"""
    try:
        # Test database connection
        test_user = UserAdminDetails.query.filter_by(name='john_doe').first()
        return jsonify({
            "status": "success",
            "message": "Server is running and database is connected",
            "test_user_exists": test_user is not None
        })
    except Exception as e:
        logger.error(f"Test connection error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/health_assistant/validate", methods=["POST", "OPTIONS"])
def validate_user():
    """Handle user login"""
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    try:
        data = request.get_json()
        logger.info("Login attempt received")
        logger.info(f"Request data: {data}")
        
        if not data:
            logger.error("No JSON data received")
            return jsonify({"success": False, "message": "No data received"}), 400

        username = data.get("username")
        password = data.get("password")
        
        logger.info(f"Login attempt for username: {username}")

        if not username or not password:
            logger.error("Missing username or password")
            return jsonify({"success": False, "message": "Username and password are required"}), 400

        # Query using name field that matches the username
        user = UserAdminDetails.query.filter_by(name=username).first()
        logger.info(f"Found user object: {user}")
        
        if user and user.password == password:
            # Get user's health data
            health_data = HealthData.query.get(user.id)
            logger.info(f"Health data found: {health_data}")
            
            # Clear any existing session data
            session.clear()
            
            # Set session data
            session["user_id"] = user.id
            session["username"] = user.name
            session["user_type"] = user.user_type
            
            response_data = {
                "success": True,
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "user_type": user.user_type
                },
                "message": "Login successful"
            }
            
            if health_data:
                response_data["health_data"] = health_data.to_dict()
            
            logger.info(f"Login successful for user: {username}")
            logger.info(f"Session data: {dict(session)}")
            logger.info(f"Response data: {response_data}")
            
            response = jsonify(response_data)
            return response, 200
        else:
            logger.warning(f"Login failed for user: {username}")
            return jsonify({
                "success": False,
                "message": "Invalid username or password"
            }), 401
                    
    except Exception as e:
        logger.error(f"Error in validate_user: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "message": "An error occurred while processing your request"
        }), 500

@app.route("/health_assistant/debug", methods=["GET"])
def debug_db():
    """Debug endpoint to check database state"""
    try:
        users = UserAdminDetails.query.all()
        result = []
        for user in users:
            user_data = {
                "id": user.id,
                "name": user.name,
                "type": user.user_type,
                "password": user.password,
                "health_data": None
            }
            
            # Get associated health data
            health_data = HealthData.query.get(user.id)
            if health_data:
                user_data["health_data"] = health_data.to_dict()
            
            result.append(user_data)
            
        return jsonify({
            "message": "Database query successful",
            "users": result,
            "session": dict(session)
        }), 200
            
    except Exception as e:
        logger.error(f"Error in debug_db: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)