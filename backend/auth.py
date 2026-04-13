import jwt
import datetime
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

SECRET_KEY = 'your_secret_key'  # Change this to a secure key

# Function to create JWT token
def create_token(user_id):
    expiration_time = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    token = jwt.encode({'user_id': user_id, 'exp': expiration_time}, SECRET_KEY, algorithm='HS256')
    return token

# Function to authenticate user
def authenticate(username, password):
    # Here you should fetch the user from database
    user = get_user_from_db(username)  # Implement this based on your database
    if user and check_password_hash(user['password'], password):
        return create_token(user['id'])
    return None

# Middleware to protect routes
def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = get_user_from_db_by_id(data['user_id'])  # Implement this based on your database
        except:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)
    return decorator

# Replace these functions with actual database calls

def get_user_from_db(username):
    # Implement database fetching logic
    return None

def get_user_from_db_by_id(user_id):
    # Implement database fetching logic
    return None
