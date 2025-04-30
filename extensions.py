from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_migrate import Migrate
db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
mail=Mail()

login_manager.login_view = 'auth.connexion'  # Redirige vers la page de connexion si non authentifié
migrate = Migrate()