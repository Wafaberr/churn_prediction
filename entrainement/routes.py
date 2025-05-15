import os
import traceback
import pandas as pd
import joblib

from flask import Blueprint, request, render_template, jsonify, abort, current_app
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.svm import SVC

from extensions import db
from models import UseCase, Experiment, UseCasePretrained
from utils import get_safe_filepath

entrainement = Blueprint('entrainement', __name__, url_prefix='/entrainement')
MODEL_REGISTRY = {
    'randomforest': RandomForestClassifier,
    'adaboost': AdaBoostClassifier,
    'gradientboosting': GradientBoostingClassifier,
    'logistic': LogisticRegression,
    'svm': SVC,
    'knn': KNeighborsClassifier
}

# 🔹 Créer une nouvelle expérience
@entrainement.route('/newexperiment')
def new_experiment():
    filename = request.args.get('filename')
    use_case_id = request.args.get('use_case_id')

    if not filename or not use_case_id:
        abort(400, "Paramètres filename et use_case_id requis")

    use_case = UseCase.query.get(use_case_id)
    if not use_case or use_case.filename != filename:
        abort(400, "Cas d'utilisation invalide")

    return render_template('entrainement/new_experiment.html', filename=filename, use_case={
        'id': use_case.id,
        'name': use_case.name,
        'description': use_case.description,
        'tag': use_case.tag,
        'task_type': use_case.task_type,
        'created_at': use_case.created_at.strftime('%Y-%m-%d %H:%M')
    })

# 🔹 Lancer une expérience personnalisée avec pipeline dynamique
@entrainement.route('/run_experiment/<int:use_case_id>', methods=['POST'])
@entrainement.route('/run_experiment/<int:use_case_id>', methods=['POST'])
def run_experiment(use_case_id):
    if not request.is_json:
        abort(400, "Requête JSON attendue")

    data = request.get_json()
    features = data.get("features", [])
    models = data.get("models", [])

    if not features:
        return jsonify({'status': 'error', 'message': 'Aucune feature sélectionnée'}), 400
    if not models:
        return jsonify({'status': 'error', 'message': 'Aucun modèle sélectionné'}), 400

    try:
        use_case = UseCase.query.get_or_404(use_case_id)
        filepath = get_safe_filepath(use_case.filename)
        df = pd.read_csv(filepath) if filepath.endswith('.csv') else pd.read_excel(filepath)

        target_column = use_case.target_column
        if target_column not in df.columns:
            return jsonify({'status': 'error', 'message': f"Colonne cible '{target_column}' absente"}), 400

        X = df.drop(columns=[target_column])
        y = df[target_column]

        selected_feature_names = [f['name'] for f in features]
        X = X[selected_feature_names]

        numerical_features, categorical_features = [], []
        feature_strategies = {f['name']: f for f in features}

        for f in features:
            if 'int' in f['type'] or 'float' in f['type']:
                numerical_features.append(f['name'])
            elif 'object' in f['type'] or 'category' in f['type']:
                categorical_features.append(f['name'])

        def get_num_pipeline(strategy):
            impute = strategy.get('imputation', 'mean')
            transform = strategy.get('transformer', 'standard')
            imputer = SimpleImputer(strategy=impute if impute in ['mean', 'median'] else 'constant', fill_value=0)
            scaler = {
                'standard': StandardScaler(),
                'minmax': MinMaxScaler(),
                'robust': RobustScaler()
            }.get(transform, StandardScaler())
            return Pipeline([('imputer', imputer), ('scaler', scaler)])

        def get_cat_pipeline(strategy):
            impute = strategy.get('imputation', 'mode')
            transform = strategy.get('transformer', 'ordinal')
            imputer = SimpleImputer(strategy='most_frequent' if impute == 'mode' else 'constant', fill_value='Unknown')
            encoder = {
                'onehot': OneHotEncoder(handle_unknown='ignore'),
                'ordinal': OrdinalEncoder()
            }.get(transform, OrdinalEncoder())
            return Pipeline([('imputer', imputer), ('encoder', encoder)])

        transformers = []
        if numerical_features:
            transformers.append(('num', get_num_pipeline(feature_strategies[numerical_features[0]]), numerical_features))
        if categorical_features:
            transformers.append(('cat', get_cat_pipeline(feature_strategies[categorical_features[0]]), categorical_features))

        preprocessor = ColumnTransformer(transformers=transformers)

        model_info = models[0]  # Premier modèle sélectionné
        model_name = model_info['name'].lower()
        model_params = model_info.get('params', {})

        ModelClass = MODEL_REGISTRY.get(model_name)
        if not ModelClass:
            return jsonify({'status': 'error', 'message': f'Modèle inconnu : {model_name}'}), 400

        model = ModelClass(**model_params)

        pipeline = Pipeline([
            ('preprocessing', preprocessor),
            ('model', model)
        ])

        pipeline.fit(X, y)
        y_pred = pipeline.predict(X)

        metrics = {
            'accuracy': round(accuracy_score(y, y_pred), 4),
            'precision': round(precision_score(y, y_pred, zero_division=0), 4),
            'recall': round(recall_score(y, y_pred, zero_division=0), 4),
            'f1_score': round(f1_score(y, y_pred, zero_division=0), 4)
        }

        # Sauvegarde de l'expérience dans la DB
        experiment = Experiment(
            use_case_id=use_case_id,
            parameters=data,
            results=metrics,
            status='completed'
        )
        db.session.add(experiment)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'experiment_id': experiment.id,
            'metrics': metrics,
            'message': 'Expérience exécutée et sauvegardée avec succès'
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur run_experiment: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# 🔹 Récupérer les colonnes du dataset
@entrainement.route('/get_dataset_columns/<filename>')
def get_dataset_columns(filename):
    try:
        filepath = get_safe_filepath(filename)
        df = pd.read_csv(filepath) if filename.endswith('.csv') else pd.read_excel(filepath)

        return jsonify({
            'status': 'success',
            'columns': list(df.columns),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'sample': df.head(5).to_dict(orient='records')
        })

    except Exception as e:
        current_app.logger.error(f"Erreur get_dataset_columns: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# 🔹 Charger l’expérience existante dans un popup (iframe)
@entrainement.route('/experiment')
def experiment():
    use_case_id = request.args.get('use_case_id')
    if not use_case_id:
        abort(400, "Paramètre use_case_id requis")

    use_case = UseCase.query.get(use_case_id)
    if not use_case:
        abort(404, "Cas d'utilisation non trouvé")

    return render_template('entrainement/experiment.html',
                           filename=use_case.filename,
                           use_case_id=use_case_id,
                           is_popup=request.args.get('popup', False))

# 🔹 Paramètres du use case (type, cible, etc.)
@entrainement.route('/get_experiment_params/<int:use_case_id>')
def get_experiment_params(use_case_id):
    try:
        use_case = UseCase.query.get_or_404(use_case_id)
        return jsonify({
            'status': 'success',
            'data': {
                'name': use_case.name,
                'type': use_case.task_type,
                'filename': use_case.filename,
                'target_column': use_case.target_column,
                'positive_class': use_case.positive_class
            }
        })
    except Exception as e:
        current_app.logger.error(f"Erreur get_experiment_params: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# 🔹 Charger une expérience pré-entraînée
@entrainement.route('/pretrained_experiment')
def pretrained_experiment():
    filename = request.args.get('filename')
    use_case_id = request.args.get('use_case_id')

    use_case = UseCasePretrained.query.get(use_case_id)
    if not use_case or use_case.filename != filename:
        abort(400, "Cas d'utilisation pré-entraîné invalide")

    return render_template('entrainement/pretrained_experiment.html',
                           filename=filename,
                           use_case_id=use_case_id,
                           use_case_name=use_case.name,
                           model_path=use_case.model_path,
                           target_column=use_case.target_column)

# 🔹 Exécuter un modèle pré-entraîné
@entrainement.route('/run_pretrained', methods=['POST'])
def run_pretrained():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    filename = data.get('filename')
    use_case_id = data.get('use_case_id')

    use_case = UseCasePretrained.query.get(use_case_id)
    if not use_case or use_case.filename != filename:
        return jsonify({'error': 'Invalid use case or filename'}), 404

    try:
        filepath = get_safe_filepath(filename)
        df = pd.read_csv(filepath) if filename.endswith('.csv') else pd.read_excel(filepath)

        target = use_case.target_column
        if target not in df.columns:
            return jsonify({'error': f"Target column '{target}' not found in file"}), 400

        X = df.drop(columns=[target])
        y = df[target]

        model_path = os.path.join(current_app.config['MODELS_DIR'], use_case.model_path)
        if not os.path.exists(model_path):
            return jsonify({'error': 'Model file not found'}), 404

        model = joblib.load(model_path)
        y_pred = model.predict(X)

        y_proba = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else None

        metrics = {
            'accuracy': round(accuracy_score(y, y_pred), 4),
            'precision': round(precision_score(y, y_pred, zero_division=0), 4),
            'recall': round(recall_score(y, y_pred, zero_division=0), 4),
            'f1_score': round(f1_score(y, y_pred, zero_division=0), 4)
        }

        if y_proba is not None:
            try:
                metrics['auc_roc'] = round(roc_auc_score(y, y_proba), 4)
            except Exception as e:
                current_app.logger.warning(f"ROC AUC computation failed: {e}")

        return jsonify({
            'metrics': metrics,
            'predictions': [{'id': idx, 'prediction': int(pred)} for idx, pred in enumerate(y_pred)],
            'dataset_size': len(df),
            'message': f"{len(df)} échantillons analysés"
        })

    except Exception as e:
        current_app.logger.error(f"Error in run_pretrained: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': 'Execution error', 'message': str(e)}), 500
