# Route pour afficher une nouvelle expérience
import os
from flask import current_app, jsonify
from flask import Blueprint, render_template, request, abort
import pandas as pd
from models import UseCase, Experiment
from extensions import db
entrainement = Blueprint('use_case', __name__, url_prefix='/use_case')


@entrainement.route('/new_experiment')
def new_experiment():
    use_case_id = request.args.get('use_case_id')
    use_case_data = UseCase.query.get(use_case_id)
    
    if not use_case_data:
        abort(404)  # Si le cas d'utilisation n'est pas trouvé, erreur 404
    
    return render_template('experimentpage.html', 
                           use_case=use_case_data,
                           filename=use_case_data.filename)

# Route pour exécuter une expérience
@entrainement.route('/experiment')
def experiment():
    use_case_id = request.args.get('use_case_id')
    use_case_data = UseCase.query.get(use_case_id)
    
    if not use_case_data:
        abort(404)  # Erreur si le cas d'utilisation n'est pas trouvé
    
    return render_template('experiment.html', 
                         use_case=use_case_data,
                         filename=use_case_data.filename)

# Route pour obtenir les paramètres d'une expérience
@entrainement.route('/get_experiment_params/<int:use_case_id>')
def get_experiment_params(use_case_id):
    use_case = UseCase.query.get(use_case_id)
    if not use_case:
        abort(404)  # Si le cas d'utilisation n'est pas trouvé
    
    return jsonify({
        'name': use_case.name,
        'type': use_case.task_type,
        'filename': use_case.filename
    })

# Route pour lancer une expérience et sauvegarder les résultats
@entrainement.route('/run_experiment/<int:use_case_id>', methods=['POST'])
def run_experiment(use_case_id):
    data = request.get_json()
    
    experiment_id = save_experiment(use_case_id, data)
    
    # Exemple de résultats fictifs
    results = {
        'accuracy': 0.95,
        'precision': 0.93,
        'recall': 0.94,
        'f1_score': 0.935
    }
    
    experiment = Experiment.query.get(experiment_id)
    if experiment:
        experiment.results = results
        db.session.commit()
    
    return jsonify({
        'status': 'success',
        'experiment_id': experiment_id,
        'message': 'Experiment completed successfully'
    })

# Route pour obtenir les résultats d'une expérience
@entrainement.route('/get_experiment_results/<int:experiment_id>')
def get_experiment_results(experiment_id):
    results = get_results_from_db(experiment_id)
    return jsonify({
        'status': 'success',
        'results': results
    })

# Route pour obtenir les colonnes d'un dataset
@entrainement.route('/get_dataset_columns/<filename>')
def get_dataset_columns(filename):
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    try:
        ext = filename.rsplit('.', 1)[-1].lower()
        if ext == 'csv':
            df = pd.read_csv(filepath)
        elif ext in ['xls', 'xlsx']:
            df = pd.read_excel(filepath)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400

        return jsonify({
            'columns': list(df.columns),
            'dtypes': df.dtypes.astype(str).to_dict()
        })
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

# Fonction utilitaire pour sauvegarder une expérience
def save_experiment(use_case_id, params):
    experiment = Experiment(
        use_case_id=use_case_id,
        parameters=params,
        status='running'
    )
    db.session.add(experiment)
    db.session.commit()
    return experiment.id

# Fonction pour obtenir les résultats depuis la base de données
def get_results_from_db(experiment_id):
    experiment = Experiment.query.get(experiment_id)
    if not experiment:
        abort(404)
    return experiment.results

# Route pour la comparaison des modèles
@entrainement.route('/model_comparison')
def model_comparison():
    # Exemple de données pour la comparaison des modèles
    models_data = {
        "Random Forest": {
            "training_time": "45s",
            "updated_at": "2023-05-15 14:30",
            "metrics": {
                "Accuracy": 0.92,
                "Balanced Acc": 0.91,
                "F1 Score": 0.93,
                "Precision": 0.94,
                "Recall": 0.92,
                "AUC ROC": 0.96,
                "Avg Precision": 0.95,
                "Inference Time": "5ms"
            },
            "roc_curve": {
                "fpr": [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
                "tpr": [0.0, 0.8, 0.85, 0.88, 0.9, 0.92, 0.94, 0.95, 0.97, 0.98, 1.0]
            },
            "confusion_matrix": {
                "tn": 50, "fp": 5, "fn": 3, "tp": 42
            }
        },
        # Ajoutez les autres modèles de la même manière...
        "SVM": {
            # ... mêmes champs que Random Forest
        }
    }
    
    return render_template('model.html', models_data=models_data)
