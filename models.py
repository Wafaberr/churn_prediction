
from datetime import datetime
from extensions import db ,bcrypt 
from flask_login import UserMixin

 # Modèle utilisateur
class User(UserMixin, db.Model):
        id = db.Column(db.Integer, primary_key=True)
        email = db.Column(db.String(120), unique=True, nullable=False)
        name = db.Column(db.String(100))
        phone = db.Column(db.String(20))
        password_hash = db.Column(db.String(128), nullable=False)
        reset_token = db.Column(db.String(100), nullable=True)
        def set_password(self, password):
            self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

        def check_password(self, password):
            return bcrypt.check_password_hash(self.password_hash, password)
# Database model for UseCase
class UseCase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    tag = db.Column(db.String(50))
    task_type = db.Column(db.String(50))
    filename = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<UseCase {self.name}>'
