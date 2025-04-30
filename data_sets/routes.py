import os
from flask import Blueprint, request, jsonify, render_template,send_from_directory
from utils import allowed_file
from werkzeug.utils import secure_filename# Assurez-vous que le fichier app.py est dans le même répertoire
from flask import current_app
from datetime import datetime
import pandas as pd
data_set = Blueprint('data_set', __name__, url_prefix='/data_set')

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

@data_set.route('/data_set/uploads/<filename>')
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
