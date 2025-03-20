-- Create the database
CREATE DATABASE IF NOT EXISTS Medical_Bot;
USE Medical_Bot;

-- Create user_admin_details table
CREATE TABLE IF NOT EXISTS user_admin_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_type ENUM('user', 'admin') NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create health_data table
CREATE TABLE IF NOT EXISTS health_data (
    id INT PRIMARY KEY,
    age INT,
    gender VARCHAR(20),
    health_condition VARCHAR(200),
    ethnicity VARCHAR(100),
    allergies TEXT,
    height FLOAT,
    weight FLOAT,
    surgical_history TEXT,
    current_medication TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES user_admin_details(id)
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    satisfied BOOLEAN DEFAULT TRUE,
    given_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_admin_details(id)
);

-- Insert default admin user
INSERT INTO user_admin_details (name, user_type, password) 
VALUES ('admin', 'admin', 'admin123')
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample user with health data
INSERT INTO user_admin_details (name, user_type, password) 
VALUES ('john_doe', 'user', 'password123')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO health_data (id, age, gender, health_condition, ethnicity, allergies, height, weight, surgical_history, current_medication)
SELECT 
    (SELECT id FROM user_admin_details WHERE name = 'john_doe'),
    35,
    'Male',
    'Hypertension',
    'Caucasian',
    'Penicillin',
    175.5,
    70.2,
    'Appendectomy (2018)',
    'Lisinopril 10mg daily'
WHERE NOT EXISTS (
    SELECT 1 FROM health_data 
    WHERE id = (SELECT id FROM user_admin_details WHERE name = 'john_doe')
);
