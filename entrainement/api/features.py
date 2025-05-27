from flask import Blueprint, jsonify, request
from entrainement.services.feature_service import FeatureService
from extensions import db
from models import Feature

features_bp = Blueprint('features', __name__)

@features_bp.route('/save_features', methods=['POST'])
def save_features():
    data = request.json  # reçoit une liste de features depuis le frontend

    # Nettoyer les anciennes configurations si nécessaire
    Feature.query.delete()

    for f in data:
        config = Feature(
            name=f['name'],
            selected=f.get('selected', False),
            status=f.get('status'),
            type=f.get('type'),
            meaning=f.get('meaning'),
            imputation=f.get('imputation'),
            transformer=f.get('transformer'),
            usecase_id=f.get('use_case_id', None)  # Assurez-vous que use_case_id est fourni
        )
        db.session.add(config)

    db.session.commit()
    return jsonify({'message': 'Configurations enregistrées avec succès'})

@features_bp.route('/features/<int:feature_id>', methods=['PATCH'])
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