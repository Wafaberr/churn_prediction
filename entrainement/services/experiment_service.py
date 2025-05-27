from datetime import datetime
from models import Experiment, HyperparameterConfig, db
from ml import model_training, evaluation, feature_processing, augmentation

class ExperimentService:
    @staticmethod
    def create_experiment(name, test_set_ratio=0.1):
        experiment = Experiment(
            name=name,
            test_set_ratio=test_set_ratio,
            status='pending',
            created_at=datetime.now()
        )
        db.session.add(experiment)
        db.session.commit()
        return experiment

    @staticmethod
    def run_experiment(experiment_id, config):
        experiment = Experiment.query.get(experiment_id)
        if not experiment:
            return None
        
        experiment.status = 'running'
        db.session.commit()

        try:
            # Chargement des données (à adapter selon votre source)
            import pandas as pd
            from sklearn.datasets import make_classification
            X, y = make_classification(n_samples=1000, n_features=20, n_classes=2, random_state=42)
            
            # Application de l'augmentation des données si sélectionnée
            if config.get('augmentations'):
                X, y = augmentation.apply_augmentation(X, y, config['augmentations'])
            
            # Séparation train/test
            from sklearn.model_selection import train_test_split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=config['test_set_ratio'], 
                random_state=42
            )
            
            # Prétraitement des features
            X_train = feature_processing.process_features(X_train)
            X_test = feature_processing.process_features(X_test)
            
            # Récupération des modèles sélectionnés
            from models import MLModel
            selected_models = MLModel.query.filter_by(selected=True).all()
            results = {}
            
            # Entraînement et évaluation
            for model in selected_models:
                ml_model = model_training.get_model(model.name)
                trained_model = model_training.train_model(
                    ml_model, 
                    X_train, 
                    y_train,
                    hyperparams=config.get('hyperparameters', {}).get(model.name, {})
                )
                model_results = evaluation.evaluate_model(trained_model, X_test, y_test)
                results[model.name] = model_results
            
            experiment.results = results
            experiment.status = 'completed'
        except Exception as e:
            experiment.status = 'failed'
            experiment.results = {'error': str(e)}
        
        db.session.commit()
        return experiment