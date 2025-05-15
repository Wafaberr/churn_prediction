from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier

class ModelTrainer:
    @staticmethod
    def get_model(model_name):
        models = {
            "Random Forest": RandomForestClassifier(),
            "AdaBoost": AdaBoostClassifier()
        }
        return models.get(model_name)

    @staticmethod
    def train_model(model, X_train, y_train):
        return model.fit(X_train, y_train)