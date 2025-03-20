from flask import Flask, request, jsonify, session
from flask_cors import CORS
from database import db, init_db, UserAdminDetails, HealthData, Feedback
from sqlalchemy.exc import SQLAlchemyError
import os
import logging
import traceback
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAI, ChatOpenAI
import pinecone
from pinecone import Pinecone

# Initialize Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize API keys and configurations
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
PINECONE_ENVIRONMENT = os.environ.get('PINECONE_ENVIRONMENT', 'gcp-starter')
PINECONE_INDEX_NAME = os.environ.get('PINECONE_INDEX_NAME', 'medicalbot')

if not PINECONE_API_KEY or not OPENAI_API_KEY:
    raise ValueError("Missing required API keys. Please set PINECONE_API_KEY and OPENAI_API_KEY in environment variables.")

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

# Initialize embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Initialize vector store
try:
    index = pc.Index(PINECONE_INDEX_NAME)
    docsearch = PineconeVectorStore(
        index=index,
        embedding=embeddings
    )
    retriever = docsearch.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}
    )
    logger.info("Successfully initialized Pinecone vector store")
except Exception as e:
    logger.error(f"Error initializing Pinecone: {str(e)}")
    logger.error(traceback.format_exc())
    raise

# Initialize LLM
try:
    llm = ChatOpenAI(
        api_key=OPENAI_API_KEY,
        model_name="gpt-3.5-turbo",
        temperature=0.1
    )
    logger.info("Successfully initialized ChatOpenAI")
except Exception as e:
    logger.error(f"Error initializing ChatOpenAI: {str(e)}")
    logger.error(traceback.format_exc())
    raise

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

@app.route("/health_assistant/feedback", methods=["POST", "OPTIONS"])
def submit_feedback():
    """Handle feedback submission"""
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    try:
        # Check if user is authenticated via session
        if not session.get('user_id'):
            logger.error("User not authenticated")
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        data = request.get_json()
        logger.info("Feedback submission received")
        logger.info(f"Request data: {data}")
        
        if not data:
            logger.error("No JSON data received")
            return jsonify({"success": False, "message": "No data received"}), 400

        username = data.get("username")
        rating = data.get("rating")
        comment = data.get("comment")
        satisfied = data.get("satisfied")
        
        if not username or not rating:
            logger.error("Missing required feedback fields")
            return jsonify({"success": False, "message": "Username and rating are required"}), 400

        # Verify that the username matches the session user
        if username != session.get('username'):
            logger.error("Username mismatch with session")
            return jsonify({"success": False, "message": "Invalid user"}), 403

        # Get user by username
        user = UserAdminDetails.query.filter_by(name=username).first()
        if not user:
            logger.error(f"User not found: {username}")
            return jsonify({"success": False, "message": "User not found"}), 404

        # Create new feedback entry
        feedback = Feedback(
            user_id=user.id,
            rating=rating,
            comment=comment,
            satisfied=satisfied
        )
        
        db.session.add(feedback)
        db.session.commit()
        
        # Clear session after successful feedback submission
        # session.clear()
        
        logger.info(f"Feedback submitted successfully for user: {username}")
        response = jsonify({
            "success": True,
            "message": "Feedback submitted successfully"
        })
    
        # Clear session only after sending response
        response.set_cookie("session", "", expires=0)  # Properly clears session
        return response, 200
            
    except Exception as e:
        logger.error(f"Error in submit_feedback: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "message": "An error occurred while processing your request"
        }), 500

@app.route("/health_assistant/chat", methods=["POST", "OPTIONS"])
def chat():
    """Handle chat messages"""
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    try:
        # Check if user is authenticated via session
        if not session.get('user_id'):
            logger.error("User not authenticated")
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        data = request.get_json()
        logger.info("Chat message received")
        logger.info(f"Request data: {data}")
        
        if not data or 'message' not in data:
            logger.error("No message received")
            return jsonify({"success": False, "message": "No message received"}), 400

        message = data.get('message')
        username = data.get('username')

        # Get user's health data for context
        user = UserAdminDetails.query.filter_by(name=username).first()
        if not user:
            logger.error(f"User not found: {username}")
            return jsonify({"success": False, "message": "User not found"}), 404

        health_data = HealthData.query.get(user.id)
        
        # Get relevant documents from vector store
        try:
            docs = retriever.get_relevant_documents(message)
            logger.info(f"Retrieved {len(docs)} documents")
            
            if not docs:
                return jsonify({
                    "success": True,
                    "response": "I apologize, but I don't have any relevant medical information to answer this question."
                })
            
            # Prepare context with user's health data
            context = "\n\n".join([doc.page_content for doc in docs])
            health_context = ""
            if health_data:
                health_context = f"""
                Patient Information:
                Health Condition: {health_data.health_condition}
                Age: {health_data.age}
                Gender: {health_data.gender}
                Allergies: {health_data.allergies}
                Current Medication: {health_data.current_medication}
                Surgical History: {health_data.surgical_history}
                """
            
            # Generate response using LLM
            prompt_template = f"""Based on the following medical information and patient context, answer the question.
            If the information is not sufficient to answer the question, say so.
            
            {health_context}
            
            Medical Information:
            {context}
            
            Question: {message}
            
            Answer:"""
            
            response = llm.predict(prompt_template)
            logger.info(f"Generated response: {response}")
            
            return jsonify({
                "success": True,
                "response": response
            })
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                "success": True,
                "response": "I apologize, but I encountered an error. Please try again."
            }), 500
            
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "message": "An error occurred while processing your request"
        }), 500

@app.route("/health_assistant/smart-questions", methods=["POST", "OPTIONS"])
def get_smart_questions():
    """Generate smart questions based on user's health data"""
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    try:
        # Check if user is authenticated
        if not session.get('user_id'):
            logger.error("User not authenticated")
            response = jsonify({"success": False, "message": "User not authenticated"})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 401

        data = request.get_json()
        if not data:
            logger.error("No JSON data received")
            return jsonify({"success": False, "message": "No data received"}), 400

        username = data.get('username')
        if not username:
            logger.error("No username provided")
            return jsonify({"success": False, "message": "Username is required"}), 400
            
        # For admin users, return empty list (no smart questions needed)
        if session.get('user_type') == 'admin':
            response = jsonify({"success": True, "questions": []})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response

        # Get user's health data
        user = UserAdminDetails.query.filter_by(name=username).first()
        if not user:
            logger.error(f"User not found: {username}")
            return jsonify({"success": False, "message": "User not found"}), 404

        health_data = HealthData.query.get(user.id)
        if not health_data:
            response = jsonify({"success": True, "questions": []})
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response

        # Generate smart questions based on health data
        prompt = f"""Based on the patient's health profile, generate 4 relevant and personalized questions:
        Health Condition: {health_data.health_condition}
        Age: {health_data.age}
        Gender: {health_data.gender}
        Allergies: {health_data.allergies}
        Current Medication: {health_data.current_medication}
        Surgical History: {health_data.surgical_history}
        
        Generate 4 specific questions that would be relevant and helpful for this patient.
        Focus on their health condition, medications, and potential health management strategies.
        The questions should be in a way that they are being asked by the patient.
        """
        
        questions = llm.predict(prompt).strip().split('\n')
        # Clean up questions and ensure we have exactly 4
        questions = [q.strip().strip('0123456789.') for q in questions if q.strip()][:4]
        while len(questions) < 4:
            questions.append("What are some general health tips?")

        response = jsonify({
            "success": True,
            "questions": questions
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    except Exception as e:
        logger.error(f"Error generating smart questions: {str(e)}")
        logger.error(traceback.format_exc())
        response = jsonify({
            "success": False,
            "message": "An error occurred while generating questions"
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)