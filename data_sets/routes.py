import os
from flask import Blueprint, app, request, jsonify, render_template,send_from_directory
from utils import allowed_file
from werkzeug.utils import secure_filename# Assurez-vous que le fichier app.py est dans le même répertoire
from flask import current_app
from datetime import datetime
import pandas as pd
data_set = Blueprint('data_set', __name__, url_prefix='/data_set')

@data_set.route('/contenudata')
def contenudata():
    files = os.listdir(current_app.config['UPLOAD_FOLDER'])
    return render_template('/data_set/contenudata.html', files=files)


@data_set.route('/upload', methods=['POST'])
def upload():
    if 'dataset' not in request.files:
        return jsonify({'error': 'No file received'}), 400

    file = request.files['dataset']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    try:
        file.save(filepath)
        return jsonify({'filename': filename, 'message': 'File uploaded successfully'})
    except Exception as e:
        return jsonify({'error': f'Error saving file: {str(e)}'}), 500
def upload_file():
    if 'dataset' not in request.files: # Check if the file part is present in the request
        return jsonify({'error': 'No dataset part in the request'}), 400
    file = request.files['dataset']
    if file.filename == '': # Check if the user did not select a file
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = file.filename
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename)) # Save the file in the UPLOAD_FOLDER
        return jsonify({'filename': filename}), 200
    return jsonify({'error': 'Upload failed'}), 500


@data_set.route('uploads/<filename>')
def get_dataset(filename):
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
            'filename': filename,
            'data': df.head(100).to_dict(orient='records'),
            'columns': list(df.columns),
            'total_rows': len(df)
        })
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@data_set.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, as_attachment=True, mimetype='application/octet-stream')

@data_set.route('/delete_dataset', methods=['DELETE'])
def delete_dataset():
    filename = request.args.get('filename')
    
    if not filename:
        return jsonify({'error': 'Filename parameter is required'}), 400
    
    safe_filename = secure_filename(filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], safe_filename)
    
    if not os.path.abspath(filepath).startswith(os.path.abspath(current_app.config['UPLOAD_FOLDER'])):
        return jsonify({'error': 'Invalid file path'}), 400
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        os.remove(filepath)
        return jsonify({
            'success': True,
            'message': f'File {safe_filename} deleted successfully'
        })
    except Exception as e:
        return jsonify({'error': f'Could not delete file: {str(e)}'}), 500

@data_set.route('/use_case/listdatasets')
def listdatasets():
    files = []
    upload_folder = current_app.config['UPLOAD_FOLDER']

    for filename in os.listdir(upload_folder):
        filepath = os.path.join(upload_folder, filename)
        if os.path.isfile(filepath):
            mod_time = os.path.getmtime(filepath)
            days_ago = (datetime.now() - datetime.fromtimestamp(mod_time)).days
            files.append({
                "name": filename,
                "updated": f"{days_ago} days ago" if days_ago > 0 else "today"
            })

    return render_template('/use_case/listdatasets.html', files=files)

@data_set.route('/datasets')
def datasets():
    files = []
    upload_folder = app.config['UPLOAD_FOLDER']

    for filename in os.listdir(upload_folder):
        filepath = os.path.join(upload_folder, filename)
        if os.path.isfile(filepath):
            mod_time = os.path.getmtime(filepath)
            days_ago = (datetime.now() - datetime.fromtimestamp(mod_time)).days
            files.append({
                "name": filename,
                "updated": f"{days_ago} days ago" if days_ago > 0 else "today"
            })

    return render_template('listdatasets.html', files=files)

@data_set.route('/newprojet/<filename>')
def newprojet(filename):
    return render_template("/use_case/newprojet.html", filename=filename)

@data_set.route('/get_string_columns', methods=['GET'])
def get_string_columns():
    filename = request.args.get('filename')

    if not filename:
        return jsonify({'error': 'Le nom du fichier est requis.'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'Fichier non trouvé.'}), 404

    try:
        _, ext = os.path.splitext(filepath)
        ext = ext.lower()

        if ext == '.csv':
            df = pd.read_csv(filepath)
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(filepath)
        else:
            return jsonify({'error': f'Format de fichier non supporté : {ext}'}), 400

        string_cols = df.select_dtypes(include=['object', 'string', 'category']).columns.tolist()
        return jsonify(string_cols)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_set.route('/get_column_values', methods=['GET'])
def get_column_values():
    filename = request.args.get('filename')
    column = request.args.get('column')

    if not filename or not column:
        return jsonify({'error': 'Le nom du fichier et de la colonne sont requis.'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Fichier non trouvé.'}), 404

    try:
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(filepath)
        elif ext in ['.xls', '.xlsx']:
            df = pd.read_excel(filepath)
        else:
            return jsonify({'error': 'Type de fichier non supporté'}), 400

        if column not in df.columns:
            return jsonify({'error': 'Colonne non trouvée dans le fichier.'}), 404

        values = df[column].dropna().unique().tolist()
        return jsonify(values)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_set.route('/get_feature_values', methods=['GET'])
def get_feature_values():
    filename = request.args.get('filename')
    selected_features = request.args.getlist('features[]')

    if not filename:
        return jsonify({'error': 'Le nom du fichier est requis'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Fichier non trouvé'}), 404

    try:
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(filepath)
        elif ext in ['.xls', '.xlsx']:
            df = pd.read_excel(filepath)
        else:
            return jsonify({'error': 'Type de fichier non supporté'}), 400

        first_row = df[selected_features].iloc[0].to_dict()
        return jsonify(first_row)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route pour afficher les statistiques d'un dataset
@data_set.route('/statisticdataset')
def statisticdataset():
    # Récupération du nom du fichier depuis les paramètres d'URL
    filename = request.args.get('filename')
    path = f'uploads/{filename}'
    
    # Détermination de l'extension du fichier pour le traitement approprié
    file_extension = os.path.splitext(filename)[1].lower()

    # Chargement du dataset en fonction de l'extension du fichier
    if file_extension == '.csv':
        df = pd.read_csv(path)
    elif file_extension in ['.xls', '.xlsx']:
        df = pd.read_excel(path)
    else:
        return "Format non supporté", 400  # Retour d'une erreur si le format n'est pas pris en charge

    # Calcul des types de données et des valeurs manquantes
    column_types = df.dtypes.apply(lambda x: str(x)).to_dict()
    missing_values = df.isnull().sum().to_dict()

    # Calcul des statistiques par colonne
    column_stats = {}
    for col in df.columns:
        stats = {}
        col_data = df[col]
        
        # Statistiques de base pour les colonnes numériques, booléennes et de date
        stats['unique'] = col_data.nunique()
        stats['missing'] = missing_values[col]
        
        if pd.api.types.is_numeric_dtype(col_data) and not pd.api.types.is_bool_dtype(col_data):
            stats.update({
                'mean': round(float(col_data.mean()), 2) if not pd.isna(col_data.mean()) else 'N/A',
                'std': round(float(col_data.std()), 2) if not pd.isna(col_data.std()) else 'N/A',
                'min': round(float(col_data.min()), 2) if not pd.isna(col_data.min()) else 'N/A',
                'max': round(float(col_data.max()), 2) if not pd.isna(col_data.max()) else 'N/A',
                '25%': round(float(col_data.quantile(0.25)), 2) if not pd.isna(col_data.quantile(0.25)) else 'N/A',
                '50%': round(float(col_data.quantile(0.5)), 2) if not pd.isna(col_data.quantile(0.5)) else 'N/A',
                '75%': round(float(col_data.quantile(0.75)), 2) if not pd.isna(col_data.quantile(0.75)) else 'N/A'
            })
        elif pd.api.types.is_bool_dtype(col_data):
            stats.update({
                'mean': 'N/A',
                'std': 'N/A',
                'min': col_data.min(),
                'max': col_data.max(),
                '25%': 'N/A',
                '50%': 'N/A',
                '75%': 'N/A'
            })
        elif pd.api.types.is_datetime64_any_dtype(col_data):
            stats.update({
                'min': col_data.min(),
                'max': col_data.max(),
                'mean': 'N/A',
                'std': 'N/A',
                '25%': 'N/A',
                '50%': 'N/A',
                '75%': 'N/A'
            })
        else:
            stats.update({
                'mean': 'N/A',
                'std': 'N/A',
                'min': 'N/A',
                'max': 'N/A',
                '25%': 'N/A',
                '50%': 'N/A',
                '75%': 'N/A'
            })
        
        column_stats[col] = stats

    # Obtention du nombre de lignes et de colonnes
    num_rows, num_cols = df.shape
    data_preview = df.head(50).to_dict(orient='records')  # Affichage des 50 premières lignes pour aperçu
    return render_template('/data_set/statisticdataset.html', 
                         filename=filename,
                         num_rows=num_rows,
                         num_cols=num_cols,
                         data_preview=data_preview,
                         column_types=column_types,
                         missing_values=missing_values,
                         column_stats=column_stats)

# Route pour obtenir les données d'une colonne spécifique d'un dataset
@data_set.route('/get_column_data/<filename>/<column>')
def get_column_data(filename, column):
    path = f'uploads/{filename}'
    
    # Vérification de l'extension du fichier et chargement
    file_extension = os.path.splitext(filename)[1].lower()

    if file_extension == '.csv':
        df = pd.read_csv(path)
    elif file_extension in ['.xls', '.xlsx']:
        df = pd.read_excel(path)
    else:
        return jsonify({"error": "Format non supporté"}), 400

    # Vérification de l'existence de la colonne
    if column not in df.columns:
        return jsonify({"error": "Colonne non trouvée"}), 404

    col_data = df[column]
    col_type = str(col_data.dtype)
    
    response_data = {
        "column": column,
        "type": col_type,
        "data": None,
        "stats": {}
    }

    # Traitement des colonnes numériques et non numériques
    if pd.api.types.is_numeric_dtype(col_data):
        response_data["data"] = {
            "labels": [str(x) for x in col_data.dropna().value_counts().index],
            "values": col_data.dropna().value_counts().values.tolist()
        }
        response_data["stats"] = {
            "mean": float(col_data.mean()),
            "median": float(col_data.median()),
            "std": float(col_data.std())
        }
    else:
        value_counts = col_data.value_counts()
        top_values = value_counts.head(20)
        response_data["data"] = {
            "labels": [str(x) for x in top_values.index],
            "values": top_values.values.tolist()
        }

    return jsonify(response_data)

# Route pour af