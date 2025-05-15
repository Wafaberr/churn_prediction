import os
from flask import Blueprint, request, jsonify, render_template, send_from_directory, current_app
from utils import allowed_file
from werkzeug.utils import secure_filename
from datetime import datetime
import pandas as pd

data_set = Blueprint('data_set', __name__, url_prefix='/data_set')

@data_set.route('/contenudata')
def contenudata():
    files = os.listdir(current_app.config['UPLOAD_FOLDER'])
    return render_template('data_set/contenudata.html', files=files)

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

@data_set.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@data_set.route('/delete_dataset', methods=['DELETE'])
def delete_dataset():
    filename = request.args.get('filename')
    
    if not filename:
        return jsonify({'error': 'Filename parameter is required'}), 400
    
    safe_filename = secure_filename(filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], safe_filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        os.remove(filepath)
        return jsonify({'success': True, 'message': f'File {safe_filename} deleted successfully'})
    except Exception as e:
        return jsonify({'error': f'Could not delete file: {str(e)}'}), 500

@data_set.route('/statisticdataset')
def statisticdataset():
    filename = request.args.get('filename')
    path = f'uploads/{filename}'
    
    file_extension = os.path.splitext(filename)[1].lower()

    if file_extension == '.csv':
        df = pd.read_csv(path)
    elif file_extension in ['.xls', '.xlsx']:
        df = pd.read_excel(path)
    else:
        return "Format non supporté", 400

    column_types = df.dtypes.apply(lambda x: str(x)).to_dict()
    missing_values = df.isnull().sum().to_dict()

    column_stats = {}
    for col in df.columns:
        stats = {}
        col_data = df[col]
        
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

    num_rows, num_cols = df.shape
    data_preview = df.head(50).to_dict(orient='records')
    return render_template('data_set/statisticdataset.html', 
                         filename=filename,
                         num_rows=num_rows,
                         num_cols=num_cols,
                         data_preview=data_preview,
                         column_types=column_types,
                         missing_values=missing_values,
                         column_stats=column_stats)

@data_set.route('/get_string_columns', methods=['GET'])
def get_string_columns():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
    
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        # Chargement du fichier selon l'extension
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(filepath)
        elif ext in ['.xls', '.xlsx']:
            df = pd.read_excel(filepath)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        # Récupération de toutes les colonnes
        all_columns = df.columns.tolist()
        return jsonify(all_columns)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@data_set.route('/get_column_values', methods=['GET'])
def get_column_values():
    filename = request.args.get('filename')
    column = request.args.get('column')
    
    if not filename or not column:
        return jsonify({'error': 'Filename and column parameters are required'}), 400
    
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(filepath)
        elif ext in ['.xls', '.xlsx']:
            df = pd.read_excel(filepath)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        if column not in df.columns:
            return jsonify({'error': 'Column not found in file'}), 404
        
        values = df[column].dropna().unique().tolist()
        return jsonify(values)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@data_set.route('/get_column_data/<filename>/<column>')
def get_column_data(filename, column):
    path = f'uploads/{filename}'
    
    file_extension = os.path.splitext(filename)[1].lower()

    if file_extension == '.csv':
        df = pd.read_csv(path)
    elif file_extension in ['.xls', '.xlsx']:
        df = pd.read_excel(path)
    else:
        return jsonify({"error": "Format non supporté"}), 400

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
    
    
