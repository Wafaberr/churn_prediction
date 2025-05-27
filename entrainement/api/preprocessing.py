import traceback
from flask import current_app, request, jsonify, Blueprint
from models import Feature, HyperparameterConfig, UseCase, ValidationConfig
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
import os
from utils import get_safe_filepath
from extensions import db
preprocessing_bp = Blueprint('preprocessing', __name__)

def build_preprocessing_pipeline(configs):
    transformers = []
    for config in configs:
        col = config.name
        steps = []

        if config.imputation:
            strat = config.imputation.lower()
            if strat in ['mean', 'median', 'most_frequent']:
                steps.append(('imputer', SimpleImputer(strategy=strat)))
            elif strat == 'constant':
                steps.append(('imputer', SimpleImputer(strategy='constant', fill_value=0)))

        if config.transformer:
            if config.transformer.lower() == 'standard':
                steps.append(('scaler', StandardScaler()))
            elif config.transformer.lower() == 'ordinal':
                steps.append(('encoder', OrdinalEncoder()))

        if steps:
            transformers.append((col, Pipeline(steps), [col]))

    return ColumnTransformer(transformers=transformers)

@preprocessing_bp.route('/preprocess_only/<int:use_case_id>', methods=['POST'])
def preprocess_only(use_case_id):
    try:
        data = request.get_json()
        use_case = UseCase.query.get_or_404(use_case_id)
        filepath = get_safe_filepath(use_case.filename)
        df = pd.read_csv(filepath) if filepath.endswith('.csv') else pd.read_excel(filepath)

        if df.empty:
            return jsonify({'status': 'error', 'message': 'Le fichier est vide ou invalide'}), 400

        configs = Feature.query.filter_by(selected=True).all()
        if not configs:
            return jsonify({'status': 'error', 'message': 'Aucune feature sélectionnée'}), 400

        target = data.get("target") or "target"
        keep_cols = [target] if target in df.columns else []

        features = [c.name for c in configs]
        X = df[features]

        transformer = build_preprocessing_pipeline(configs)
        X_trans = transformer.fit_transform(X)

        transformed_df = pd.DataFrame(X_trans, columns=features[:X_trans.shape[1]])
        if keep_cols:
            transformed_df[keep_cols[0]] = df[keep_cols[0]]
        filename = use_case.filename
        output_path = os.path.join("preprocessed_data", f"{os.path.splitext(filename)[0]}_prepro.{'csv' if filepath.endswith('.csv') else 'xlsx'}")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        if filepath.endswith('.csv'):
            transformed_df.to_csv(output_path, index=False)
        else:
            transformed_df.to_excel(output_path, index=False)

        return jsonify({
            "status": "success",
            "message": f"Prétraitement terminé. Fichier sauvegardé sous '{os.path.basename(output_path)}'",
            "output": os.path.basename(output_path)
        })

    except Exception as e:
        error_trace = traceback.format_exc()
        current_app.logger.error(f"Erreur dans preprocess_only: {e}\n{error_trace}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
    
    
@preprocessing_bp.route('/save_models/<int:use_case_id>', methods=['POST'])
def save_models(use_case_id):
    from models import ModelConfiguration
    from app import db

    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'Aucune donnée reçue'}), 400

    # Supprimer les anciennes configs
    ModelConfiguration.query.filter_by(use_case_id=use_case_id).delete()

    for item in data:
        model = ModelConfiguration(
            use_case_id=use_case_id,
            name=item.get('name'),
            selected=item.get('selected', False),
            parameters=item.get('parameters', {})
        )
        db.session.add(model)

    db.session.commit()

    return jsonify({'status': 'success', 'message': 'Modèles sauvegardés avec succès'})

@preprocessing_bp.route('/save_validation/<int:use_case_id>', methods=['POST'])
def save_validation_config(use_case_id):
    data = request.get_json()

    method = data.get("method")
    ratio = data.get("ratio")
    test_ratio = data.get("test_ratio")
    stratify = data.get("stratify")
    shuffle = data.get("shuffle")

    if method not in ["shuffle_split", "kfold"]:
        return jsonify({"status": "error", "message": "Méthode invalide"}), 400

    # Sauvegarde dans la base (exemple : table ValidationConfig liée à UseCase)
    validation = ValidationConfig.query.filter_by(use_case_id=use_case_id).first()
    if not validation:
        validation = ValidationConfig(use_case_id=use_case_id)

    validation.method = method
    validation.ratio = ratio
    validation.test_ratio = test_ratio
    validation.stratify = stratify
    validation.shuffle = shuffle

    db.session.add(validation)
    db.session.commit()

    return jsonify({"status": "success", "message": "Configuration sauvegardée"})

@preprocessing_bp.route('/get_validation/<int:use_case_id>', methods=['POST'])
def get_validation_config(use_case_id):
    try:
        # Récupérer la configuration depuis la base de données
        config = ValidationConfig.query.filter_by(use_case_id=use_case_id).first()
        
        if not config:
            return jsonify({
                'status': 'error',
                'message': 'No validation configuration found for this use case'
            }), 404
        
        # Retourner les données au format JSON
        return jsonify({
            'status': 'success',
            'method': config.method,
            'ratio': config.ratio,
            'ratio': config.test_ratio,
            'stratify': config.stratify,
            'shuffle': config.shuffle,
            'k_folds': config.k_folds if config.method == 'kfold' else None
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@preprocessing_bp.route('/save_augmentation/<int:use_case_id>', methods=['POST'])
def save_augmentation(use_case_id):
    try:
        from models import DataAugmentationConfig, db
        
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No data received'}), 400

        # Supprimer l'ancienne configuration
        DataAugmentationConfig.query.filter_by(use_case_id=use_case_id).delete()

        # Créer une nouvelle configuration
        config = DataAugmentationConfig(
            use_case_id=use_case_id,
            method=data.get('method'),
            category=data.get('category'),
            parameters=data.get('params', {})
        )

        db.session.add(config)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Data augmentation configuration saved'
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving augmentation config: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@preprocessing_bp.route('/get_augmentation/<int:use_case_id>', methods=['GET'])
def get_augmentation(use_case_id):
    try:
        from models import DataAugmentationConfig

        config = DataAugmentationConfig.query.filter_by(use_case_id=use_case_id).first()
        if not config:
            return jsonify({'status': 'error', 'message': 'No configuration found'}), 404

        return jsonify({
            'status': 'success',
            'config': {
                'method': config.method,
                'category': config.category,
                'params': config.parameters
            }
        })

    except Exception as e:
        current_app.logger.error(f"Error getting augmentation config: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
    
@preprocessing_bp.route('/save_hyperparameters/<int:use_case_id>', methods=['POST'])
def save_hyperparameters(use_case_id):
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Données JSON manquantes"}), 400

    existing = HyperparameterConfig.query.filter_by(use_case_id=use_case_id).first()
    if not existing:
        existing = HyperparameterConfig(use_case_id=use_case_id)

    existing.strategy = data.get("strategy", "grid_search")
    existing.metric = data.get("metric", "accuracy")
    existing.time_limit = data.get("time_limit", 3600)
    existing.max_combinations = data.get("max_combinations", -1)

    db.session.add(existing)
    db.session.commit()

    return jsonify({"status": "success", "message": "Configuration enregistrée"})
