from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OrdinalEncoder, StandardScaler

class FeatureProcessor:
    @staticmethod
    def handle_missing_values(data, strategy='mean'):
        imputer = SimpleImputer(strategy=strategy)
        return imputer.fit_transform(data)

    @staticmethod
    def transform_features(data, transformer_type='standard'):
        if transformer_type == 'ordinal':
            transformer = OrdinalEncoder()
        else:  # standard
            transformer = StandardScaler()
        return transformer.fit_transform(data)