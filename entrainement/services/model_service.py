from models import MLModel
from extensions import db

class ModelService:
    @staticmethod
    def get_all_models():
        return MLModel.query.all()

    @staticmethod
    def update_model_selection(model_id, selected):
        model = MLModel.query.get(model_id)
        if not model:
            return None
        model.selected = selected
        db.session.commit()
        return model