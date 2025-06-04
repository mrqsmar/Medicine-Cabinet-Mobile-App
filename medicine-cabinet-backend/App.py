from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

from models import db, User, Medication

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
db.init_app(app)
jwt = JWTManager(app)


