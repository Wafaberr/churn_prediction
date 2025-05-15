
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

class UseCasePretrained(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    tag = db.Column(db.String(50))
    task_type = db.Column(db.String(50))
    filename = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    model_path = db.Column(db.String(255))  # Pour stocker le chemin du modèle
    target_column = db.Column(db.String(100))  # Ajout de la colonne cible

    def __repr__(self):
        return f'<UseCasePretrained {self.name}>'

class ExperimentConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    use_case_id = db.Column(db.Integer, db.ForeignKey('use_case.id'), nullable=False)
    config_data = db.Column(db.JSON)  # Stocke la configuration au format JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    use_case = db.relationship('UseCase', backref=db.backref('configs', lazy=True))

class ExperimentRun(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    config_id = db.Column(db.Integer, db.ForeignKey('experiment_config.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, running, completed, failed
    results = db.Column(db.JSON)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    config = db.relationship('ExperimentConfig', backref=db.backref('runs', lazy=True))

class Experiment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    use_case_id = db.Column(db.Integer, db.ForeignKey('use_case.id'), nullable=False)
    parameters = db.Column(db.JSON, nullable=True)
    results = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    use_case = db.relationship('UseCase', backref='experiments')


class Feature(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), index=True)
    status = db.Column(db.String(20))  # 🟡️, 🟢, 🔴
    type = db.Column(db.String(50))    # object, int64, etc.
    meaning = db.Column(db.String(50)) # Categorical, Numerical
    imputation = db.Column(db.String(50)) # Mode, Mean, etc.
    transformer = db.Column(db.String(50)) # Ordinal, Standard, etc.
    selected = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Feature {self.name}>'

class MLModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), index=True)
    description = db.Column(db.Text)
    selected = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50))  # Ensemble, Tree-based, etc.

    def __repr__(self):
        return f'<MLModel {self.name}>'

class HyperparameterConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    strategy = db.Column(db.String(50))  # Grid Search, Random Search
    parameters = db.Column(db.JSON)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.id'))

    def __repr__(self):
        return f'<HyperparameterConfig {self.strategy}>'

class DataAugmentation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    method = db.Column(db.String(50))  # SMOTE, ADASYN, etc.
    selected = db.Column(db.Boolean, default=False)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.id'))

    def __repr__(self):
        return f'<DataAugmentation {self.method}>'

class ModelEvaluation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiment.id'))
    accuracy = db.Column(db.Float)
    precision = db.Column(db.Float)
    recall = db.Column(db.Float)
    f1_score = db.Column(db.Float)
    roc_auc = db.Column(db.Float)

    def __repr__(self):
        return f'<ModelEvaluation {self.experiment_id}>'
    
    