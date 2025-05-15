from flask import Blueprint, jsonify, request
from entrainement.services.model_service import ModelService

bp = Blueprint('models', __name__)

@bp.route('/models', methods=['GET'])
def get_models():
    models = ModelService.get_all_models()
    return jsonify([{
        'id': m.id,
        'name': m.name,
        'description': m.description,
        'selected': m.selected,
        'category': m.category
    } for m in models])

@bp.route('/models/<int:model_id>', methods=['PATCH'])
def update_model(model_id):
    data = request.get_json()
    model = ModelService.update_model_selection(model_id, data.get('selected', False))
    if not model:
        return jsonify({'error': 'Model not found'}), 404
    return jsonify({
        'id': model.id,
        'name': model.name,
        'selected': model.selected
    })