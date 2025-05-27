
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
    target_column = db.Column(db.String(100))
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
class ValidationConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    use_case_id = db.Column(db.Integer, db.ForeignKey('use_case.id'), nullable=False)
    method = db.Column(db.String(20))
    test_ratio = db.Column(db.Float)
    ratio = db.Column(db.Float)
    stratify = db.Column(db.Boolean)
    shuffle = db.Column(db.Boolean)
    
    use_case = db.relationship('UseCase', backref=db.backref('validation_config', lazy=True))
class Experiment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    use_case_id = db.Column(db.Integer, db.ForeignKey('use_case.id'), nullable=False)
    parameters = db.Column(db.JSON, nullable=True)
    results = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    use_case = db.relationship('UseCase', backref='experiments')
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'test_set_ratio': self.test_set_ratio,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'status': self.status,
            'results': self.results
        }
    
    @classmethod
    def create_from_dict(cls, data):
        experiment = cls(
            name=data.get('name'),
            test_set_ratio=data.get('test_set_ratio', 0.1),
            status='pending'
        )
        db.session.add(experiment)
        db.session.commit()
        return experiment


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
    use_case_id = db.Column(db.Integer, db.ForeignKey('use_case.id'), nullable=False)

class ModelConfiguration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    use_case_id = db.Column(db.Integer, db.ForeignKey('use_case.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    selected = db.Column(db.Boolean, default=False)
    parameters = db.Column(db.JSON)  # pour stocker dynamiquement les hyperparamètres
    def __repr__(self):
        return f'<ModelConfiguration {self.name}>'
    use_case = db.relationship('UseCase', backref=db.backref('model_configs', lazy=True))
    
class HyperparameterConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    use_case_id = db.Column(db.Integer, db.ForeignKey("use_case.id"))
    strategy = db.Column(db.String(50), nullable=False)
    metric = db.Column(db.String(50), nullable=False)
    time_limit = db.Column(db.Integer, default=3600)
    max_combinations = db.Column(db.Integer, default=-1)

    use_case = db.relationship("UseCase", backref="hyperparam_config")

class DataAugmentationConfig(db.Model):
    __tablename__ = 'data_augmentation_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    use_case_id = db.Column(db.Integer, db.ForeignKey('use_case.id'), nullable=False)
    method = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    parameters = db.Column(db.JSON, default={})
    
    use_case = db.relationship('UseCase', backref='data_augmentation_configs')
    
    def __repr__(self):
        return f'<DataAugmentationConfig {self.method} for UseCase {self.use_case_id}>'
    
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
    
    