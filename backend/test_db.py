from flask import Flask
from database import init_db, UserAdminDetails
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def test_database():
    try:
        # Initialize database
        init_db(app)
        
        with app.app_context():
            # Try to query users
            users = UserAdminDetails.query.all()
            logger.info("Successfully connected to database")
            logger.info("Users in database:")
            for user in users:
                logger.info(f"User: {user.name}, Type: {user.user_type}, Password: {user.password}")
            
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_database() 