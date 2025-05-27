from datetime import datetime
import os
from flask import Blueprint, current_app, json, jsonify, request
import pandas as pd
from sklearn.base import accuracy_score
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.model_selection import GridSearchCV, ShuffleSplit, StratifiedKFold
from imblearn.over_sampling import SMOTE , ADASYN, RandomOverSampler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
import lightgbm
from sklearn.tree import DecisionTreeClassifier
import xgboost
from entrainement.services import ExperimentService
from models import Experiment, UseCase, Feature, MLModel, DataAugmentation, ValidationConfig, HyperparameterSearch
from extensions import db

experiment = Blueprint('experiments', __name__)

MODEL_REGISTRY = {
    'randomforest': RandomForestClassifier,
    'adaboost': AdaBoostClassifier,
    'gradientboosting': GradientBoostingClassifier,
    'logistic': LogisticRegression,
    'svm': SVC,
    'knn': KNeighborsClassifier,
    'lightgbm': lightgbm.LGBMClassifier,
    'xgboost': xgboost.XGBClassifier,
    'decisiontree': DecisionTreeClassifier
}
@experiment.route('/experiments', methods=['POST'])
def create_experiment():
    data = request.get_json()
    experiment = ExperimentService.create_experiment(
        name=data.get('name', 'New Experiment'),
        test_set_ratio=float(data.get('test_set_ratio', 0.1))
    )
    return jsonify({
        'id': experiment.id,
        'name': experiment.name,
        'status': experiment.status
    }), 201

@experiment.route('/experiments/<int:experiment_id>/run', methods=['POST'])
def run_experiment(experiment_id):
    experiment = ExperimentService.run_experiment(experiment_id)
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    return jsonify({
        'id': experiment.id,
        'status': experiment.status,
        'results': experiment.results
    })
    
from werkzeug.exceptions import NotFound    
@experiment.route('/run_full_experiment/<int:use_case_id>', methods=['POST'])
def run_full_experiment(use_case_id):
    try:
        preprocessed=True
        use_case = UseCase.query.get_or_404(use_case_id)
        filename = f"{use_case.filename}_prepro" if preprocessed else use_case.filename
        filepath = os.path.join("preprocessed_data", filename)

    # 🔐 Vérification d'existence
        if not os.path.exists(filepath):
          raise NotFound(f"Fichier non trouvé : {filepath}")

    # 📄 Chargement du fichier
        try:
          if filename.endswith(".csv"):
            df = pd.read_csv(filepath)
          else:
            df = pd.read_excel(filepath)
        except Exception as e:
         raise RuntimeError(f"Erreur lors du chargement du fichier {filename}: {e}")
        target_column = use_case.target_column

        if target_column not in df.columns:
            return jsonify({'status': 'error', 'message': f"Colonne cible '{target_column}' introuvable"}), 400

        # 1. 📌 Récupérer les features sélectionnées
        features = Feature.query.filter_by(use_case_id=use_case_id, selected=True).all()
        if not features:
            return jsonify({'status': 'error', 'message': 'Aucune feature sélectionnée'}), 400

        selected_cols = [f.feature_name for f in features]
        df = df[selected_cols + [target_column]]

        # 2. 🧼 Appliquer preprocessing
        X = df.drop(columns=[target_column])
        y = df[target_column]

        # 3. 🔁 Appliquer la data augmentation si nécessaire
        augmentation = DataAugmentation.query.filter_by(use_case_id=use_case_id).first()
        if augmentation and augmentation.method == "smote":
            sm = SMOTE(k_neighbors=augmentation.k_neighbors or 5)
            X, y = sm.fit_resample(X, y)
        elif augmentation and augmentation.method == "adasyn":
            adasyn = ADASYN(n_neighbors=augmentation.k_neighbors or 5)
            X, y = adasyn.fit_resample(X, y)
        elif augmentation and augmentation.method == "random":
            ros = RandomOverSampler(sampling_strategy=augmentation.sampling_strategy or 'auto')
            X, y = ros.fit_resample(X, y)
            
        # 4. 🧠 Récupérer les modèles sélectionnés
        models = MLModel.query.filter_by(use_case_id=use_case_id, selected=True).all()
        if not models:
            return jsonify({'status': 'error', 'message': 'Aucun modèle sélectionné'}), 400

        # 5. 🧪 Configurer la validation et hyperparamètres
        validation = ValidationConfig.query.filter_by(use_case_id=use_case_id).first()
        search_config = HyperparameterSearch.query.filter_by(use_case_id=use_case_id).first()

        results = []
        for m in models:
            model_class = MODEL_REGISTRY.get(m.name.lower())
            if not model_class:
                continue

            model = model_class(**(m.parameters or {}))

            # Split & Grid Search
            if validation and validation.strategy == "kfold":
                cv = StratifiedKFold(n_splits=validation.k or 5, shuffle=validation.shuffle)
            else:
                cv = ShuffleSplit(n_splits=1, test_size=validation.test_size or 0.2)

            if search_config and search_config.method == "grid":
                param_grid = json.loads(m.param_grid or '{}')
                search = GridSearchCV(model, param_grid, cv=cv, scoring=search_config.metric, n_jobs=-1)
                search.fit(X_processed, y)
                best_model = search.best_estimator_
            else:
                best_model = model.fit(X_processed, y)

            y_pred = best_model.predict(X_processed)

            metrics = {
                'accuracy': round(accuracy_score(y, y_pred), 4),
                'precision': round(precision_score(y, y_pred, average='weighted', zero_division=0), 4),
                'recall': round(recall_score(y, y_pred, average='weighted', zero_division=0), 4),
                'f1_score': round(f1_score(y, y_pred, average='weighted', zero_division=0), 4)
            }

            experiment = Experiment(
                use_case_id=use_case_id,
                algorithm=m.name,
                parameters=m.parameters,
                results=metrics,
                status="completed",
                training_time=round(search.refit_time_ if search_config else 0, 3),
                updated_at=datetime.utcnow()
            )
            db.session.add(experiment)
            results.append(metrics)

        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Expériences terminées',
            'results': results
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500
