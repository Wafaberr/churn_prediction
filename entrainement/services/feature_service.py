from models import Feature
from extensions import db

class FeatureService:
    @staticmethod
    def get_all_features():
        return Feature.query.all()

    @staticmethod
    def update_feature_selection(feature_id, selected):
        feature = Feature.query.get(feature_id)
        if not feature:
            return None
        feature.selected = selected
        db.session.commit()
        return feature