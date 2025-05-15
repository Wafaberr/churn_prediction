
from pyexpat import model
from turtle import pd
from flask import Flask, render_template, request
from extensions import db , bcrypt,login_manager,mail,migrate
from flask_login import  login_required
import os
from models import User,UseCase  # Assurez-vous que le fichier models.py est dans le même répertoire
from auth.routes import auth  # Assurez-vous que le fichier routes.py est dans le même répertoire
from data_sets.routes import data_set  # Assurez-vous que le fichier routes.py est dans le même répertoire
from use_cases.routes import use_case_bp  # Assurez-vous que le fichier routes.py est dans le même répertoire
from entrainement.routes import entrainement  # Assurez-vous que le fichier routes.py est dans le même répertoire
def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev-key-insecure')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    # Configurations email
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USERNAME'] = 'berrouanewafa8@gmail.com'
    app.config['MAIL_PASSWORD'] = 'qvja ilpv dwvu hcia'
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    # Ajout important
    app.config['SERVER_NAME'] = '192.168.0.238:5000'  # (ton IP locale réelle ici)
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    # Configure upload folder
    BASE_DIR = os.getcwd()
    app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads')
    # Ajoutez cette ligne pour définir MODELS_DIR
    app.config['MODELS_DIR'] = os.path.join(BASE_DIR, 'uploads', 'pretrained_models')
    os.makedirs(app.config['MODELS_DIR'], exist_ok=True)
    
    # Initialisation des extensions
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    login_manager.login_view = 'auth.connexion'
    migrate.init_app(app, db)
    
    app.register_blueprint(auth)
    app.register_blueprint(use_case_bp)
    app.register_blueprint(data_set)
    app.register_blueprint(entrainement)
    
    @app.template_filter('number_format')
    def number_format(value):
        try:
            return "{:,.2f}".format(float(value)).replace(",", " ").replace(".", ",")
        except (ValueError, TypeError):
            return value
        
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Routes
    @app.route('/')
    @login_required
    def home():
        return render_template("home.html")
    
    @app.route('/prediction', methods=["GET", "POST"])
    def prediction():
        prediction = None
        probability = None

        if request.method == 'POST':
            input_data = pd.DataFrame([{
                'gender': request.form['gender'],
                'partner': request.form['partner'],
                'tenure': float(request.form['tenure']),
                'internet_service': request.form['internet_service'],
                'phone_service': request.form['phone_service'],
                'contract': request.form['contract'],
                'monthly_charges': float(request.form['monthly_charges']),
                'total_charges': float(request.form['total_charges'])
            }])

            result = model.predict(input_data)[0]
            probas = model.predict_proba(input_data)[0][1]
            prediction = "Churn" if result == 1 else "No Churn"
            probability = round(probas * 100, 2)

        return render_template('prediction.html', prediction=prediction, probability=probability)
    
    @app.route('/dashboard')
    def dashboard():
        powerbi_url = "https://app.powerbi.com/reportEmbed?reportId=2fcbf768-81c5-40f3-8cf3-178f9f71abef&autoAuth=true&ctid=8b2b997e-5006-4d79-8773-e9d2f9b74857"
        return render_template("dashboard.html", report_url=powerbi_url)
    return app
    
