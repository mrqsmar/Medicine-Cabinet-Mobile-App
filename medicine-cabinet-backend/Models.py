from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    """
    Represents the login for user
    Attributes:
        id (int): Primary key for the user logging in
        name: Users name
        email: email of the user
        password: password of the user
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)


class Medication(db.Model):
    """
    Represents the medication that the user needs to take 
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.String(50))
    time_of_day = db.Column(db.String(10))
    notes = db.Column(db.Text)
