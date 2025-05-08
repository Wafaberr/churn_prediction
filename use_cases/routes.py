from datetime import datetime
import os
from flask import Blueprint, request, jsonify, render_template, abort
from models import UseCase
from extensions import db
from flask import current_app

use_case_bp = Blueprint('use_case', __name__, url_prefix='/use_case')

@use_case_bp.route('/list_datasets')
def list_datasets():
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

    return render_template('use_case/listdatasets.html', files=files)

@use_case_bp.route('/create_usecase', methods=['POST'])
def create_usecase():
    data = request.get_json()
    
    try:
        new_case = UseCase(
            name=data['usecase_name'],
            description=data['usecase_description'],
            tag=data['usecase_tag'],
            task_type=data['task_type'],
            filename=data['dataset']
        )
        
        db.session.add(new_case)
        db.session.commit()
        
        return jsonify({
            'id': new_case.id,
            'name': new_case.name,
            'created_at': new_case.created_at.strftime('%Y-%m-%d %H:%M')
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@use_case_bp.route('/get_use_cases')
def get_use_cases():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'Filename parameter is required'}), 400
    
    cases = UseCase.query.filter_by(filename=filename).order_by(UseCase.created_at.desc()).all()
    
    return jsonify([{
        'id': case.id,
        'name': case.name,
        'description': case.description,
        'tag': case.tag,
        'task_type': case.task_type,
        'created_at': case.created_at.strftime('%Y-%m-%d %H:%M')
    } for case in cases])

@use_case_bp.route('/delete_usecase', methods=['DELETE'])
def delete_usecase():
    use_case_id = request.args.get('id')
    
    if not use_case_id:
        return jsonify({'error': 'ID de cas d\'utilisation requis'}), 400
    
    use_case = UseCase.query.get(use_case_id)
    
    if not use_case:
        return jsonify({'error': 'Cas d\'utilisation non trouvé'}), 404
    
    try:
        db.session.delete(use_case)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Cas d\'utilisation supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@use_case_bp.route('/update_usecase/<int:use_case_id>', methods=['PUT'])
def update_usecase(use_case_id):
    data = request.get_json()
    
    use_case = UseCase.query.get(use_case_id)
    
    if not use_case:
        return jsonify({'error': 'Cas d\'utilisation non trouvé'}), 404
    
    try:
        use_case.name = data['usecase_name']
        use_case.description = data['usecase_description']
        use_case.tag = data['usecase_tag']
        use_case.task_type = data['task_type']
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Cas d\'utilisation mis à jour avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@use_case_bp.route('/newprojet')
def newprojet():
    filename = request.args.get('filename')
    if not filename:
        return render_template('use_case/newprojet.html')
    return render_template('use_case/newprojet.html', filename=filename)

@use_case_bp.route('/newexperiment')
def newexperiment():
    use_case_id = request.args.get('use_case_id')
    filename = request.args.get('filename')
    return render_template('use_case/flow-table.html', use_case_id=use_case_id, filename=filename)