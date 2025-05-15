from flask import Blueprint, jsonify, request
from entrainement.services import ExperimentService

bp = Blueprint('experiments', __name__)

@bp.route('/experiments', methods=['POST'])
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

@bp.route('/experiments/<int:experiment_id>/run', methods=['POST'])
def run_experiment(experiment_id):
    experiment = ExperimentService.run_experiment(experiment_id)
    if not experiment:
        return jsonify({'error': 'Experiment not found'}), 404
    return jsonify({
        'id': experiment.id,
        'status': experiment.status,
        'results': experiment.results
    })