from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, text
import os
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = SQLAlchemy()

class UserAdminDetails(db.Model):
    __tablename__ = 'user_admin_details'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'user' or 'admin'
    password = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.now())
    
    # Relationships with cascade delete
    health_data = db.relationship('HealthData', backref='user', lazy=True, uselist=False, cascade='all, delete-orphan')
    feedbacks = db.relationship('Feedback', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.name} ({self.user_type})>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'user_type': self.user_type
        }

class HealthData(db.Model):
    __tablename__ = 'health_data'
    
    id = db.Column(db.Integer, db.ForeignKey('user_admin_details.id', ondelete='CASCADE'), primary_key=True)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    health_condition = db.Column(db.String(200))
    ethnicity = db.Column(db.String(100))
    allergies = db.Column(db.String(200))
    height = db.Column(db.Float)
    weight = db.Column(db.Float)
    surgical_history = db.Column(db.String(500))
    current_medication = db.Column(db.String(500))
    medicine_prescribed = db.Column(db.String(500))
    blood_group = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.now())
    updated_at = db.Column(db.DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f'<HealthData for user {self.id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'age': self.age,
            'gender': self.gender,
            'health_condition': self.health_condition,
            'ethnicity': self.ethnicity,
            'allergies': self.allergies,
            'height': self.height,
            'weight': self.weight,
            'surgical_history': self.surgical_history,
            'current_medication': self.current_medication,
            'medicine_prescribed': self.medicine_prescribed,
            'blood_group': self.blood_group
        }

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user_admin_details.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    satisfied = db.Column(db.Boolean, default=True)
    given_on = db.Column(db.DateTime, nullable=False, server_default=func.now())

    def __repr__(self):
        return f'<Feedback {self.id} from user {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'rating': self.rating,
            'comment': self.comment,
            'satisfied': self.satisfied,
            'given_on': self.given_on.isoformat() if self.given_on else None
        }

def init_db(app):
    try:
        # Configure database URI from environment variables
        db_user = os.environ.get('DB_USER', 'root')
        db_password = os.environ.get('DB_PASSWORD', 'root')
        db_host = os.environ.get('DB_HOST', 'localhost')
        db_name = os.environ.get('DB_NAME', 'Medical_Bot')

        if not all([db_user, db_password, db_host, db_name]):
            raise ValueError("Missing required database configuration")

        # First connect to MySQL without database to create it if needed
        engine_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}"
        from sqlalchemy import create_engine
        temp_engine = create_engine(engine_url)
        
        # Drop and recreate database
        with temp_engine.connect() as conn:
            conn.execute(text("COMMIT"))
            conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
            conn.execute(text(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            logger.info(f"Recreated database {db_name}")
        
        temp_engine.dispose()

        # Now configure Flask-SQLAlchemy with the full database URL
        app.config['SQLALCHEMY_DATABASE_URI'] = f"{engine_url}/{db_name}?charset=utf8mb4"
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        # Initialize Flask-SQLAlchemy
        db.init_app(app)
        
        with app.app_context():
            # Create all tables
            db.create_all()
            logger.info("Created all database tables")
            
            # Create test user if not exists
            test_user = UserAdminDetails.query.filter_by(name='john_doe').first()
            if not test_user:
                test_user = UserAdminDetails(
                    name='john_doe',
                    user_type='user',
                    password='test123'
                )
                db.session.add(test_user)
                db.session.commit()
                logger.info(f"Created test user: {test_user.name}")

                # Add health data for test user
                health_data = HealthData(
                    id=test_user.id,
                    age=35,
                    gender='Male',
                    health_condition='Hypertension',
                    ethnicity='Caucasian',
                    allergies='None',
                    height=175.0,
                    weight=75.0,
                    surgical_history='None',
                    current_medication='Lisinopril',
                    medicine_prescribed='None',
                    blood_group='O+'
                )
                db.session.add(health_data)
                db.session.commit()
                logger.info(f"Added health data for test user")

            # Create admin user if not exists
            admin_user = UserAdminDetails.query.filter_by(name='admin').first()
            if not admin_user:
                admin_user = UserAdminDetails(
                    name='admin',
                    user_type='admin',
                    password='admin123'
                )
                db.session.add(admin_user)
                db.session.commit()
                logger.info(f"Created admin user: {admin_user.name}")

            # Log all users for verification
            users = UserAdminDetails.query.all()
            for user in users:
                logger.info(f"User in database: {user.name} (type: {user.user_type})")

    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        logger.error(traceback.format_exc())
        raise
