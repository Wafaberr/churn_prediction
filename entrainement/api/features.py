from flask import Blueprint, jsonify, request
from entrainement.services.feature_service import FeatureService

bp = Blueprint('features', __name__)

@bp.route('/features', methods=['GET'])
def get_features():
    features = FeatureService.get_all_features()
    return jsonify([{
        'id': f.id,
        'name': f.name,
        'status': f.status,
        'type': f.type,
        'meaning': f.meaning,
        'imputation': f.imputation,
        'transformer': f.transformer,
        'selected': f.selected
    } for f in features])

@bp.route('/features/<int:feature_id>', methods=['PATCH'])
def update_feature(feature_id):
    data = request.get_json()
    feature = FeatureService.update_feature_selection(feature_id, data.get('selected', False))
    if not feature:
        return jsonify({'error': 'Feature not found'}), 404
    return jsonify({
        'id': feature.id,
        'name': feature.name,
        'selected': feature.selected
    })