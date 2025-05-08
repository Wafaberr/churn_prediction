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
    if not filename:
        return "Filename parameter is required", 400
    
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return "File not found", 404
    
    file_extension = os.path.splitext(filename)[1].lower()
    
    try:
        if file_extension == '.csv':
            df = pd.read_csv(filepath)
        elif file_extension in ['.xls', '.xlsx']:
            df = pd.read_excel(filepath)
        else:
            return "Unsupported file format", 400
        
        # Calcul des statistiques
        column_types = df.dtypes.apply(lambda x: str(x)).to_dict()
        missing_values = df.isnull().sum().to_dict()
        column_stats = {}
        
        for col in df.columns:
            stats = {}
            col_data = df[col]
            stats['unique'] = col_data.nunique()
            stats['missing'] = missing_values[col]
            
            if pd.api.types.is_numeric_dtype(col_data):
                stats.update({
                    'mean': round(float(col_data.mean()), 2) if not pd.isna(col_data.mean()) else 'N/A',
                    'std': round(float(col_data.std()), 2) if not pd.isna(col_data.std()) else 'N/A',
                    'min': round(float(col_data.min()), 2) if not pd.isna(col_data.min()) else 'N/A',
                    'max': round(float(col_data.max()), 2) if not pd.isna(col_data.max()) else 'N/A',
                    '25%': round(float(col_data.quantile(0.25)), 2) if not pd.isna(col_data.quantile(0.25)) else 'N/A',
                    '50%': round(float(col_data.quantile(0.5)), 2) if not pd.isna(col_data.quantile(0.5)) else 'N/A',
                    '75%': round(float(col_data.quantile(0.75)), 2) if not pd.isna(col_data.quantile(0.75)) else 'N/A'
                })
            
            column_stats[col] = stats
        
        data_preview = df.head(50).to_dict(orient='records')
        return render_template('data_set/statisticdataset.html', 
                            filename=filename,
                            num_rows=len(df),
                            num_cols=len(df.columns),
                            data_preview=data_preview,
                            column_types=column_types,
                            missing_values=missing_values,
                            column_stats=column_stats)
    
    except Exception as e:
        return f"Error processing file: {str(e)}", 500

@data_set.route('/get_string_columns', methods=['GET'])
def get_string_columns():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
    
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
        
        string_cols = df.select_dtypes(include=['object', 'string', 'category']).columns.tolist()
        return jsonify(string_cols)
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