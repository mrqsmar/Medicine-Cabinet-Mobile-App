from flask import Blueprint, request, jsonify
from models import db, User
from flask_jwt_extended import create_access_token
auth = Blueprint('auth', __name__)

# Register and use a post method
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify(error="User already exists"), 409