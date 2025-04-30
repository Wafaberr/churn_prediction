import os
from flask import Blueprint, request, jsonify, render_template, abort
from models import UseCase
from extensions import db
from flask import current_app

use_case_bp = Blueprint('use_case', __name__, url_prefix='/use_case')

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
        return jsonify({'error': 'Filename parameter is required'}),400
    
    cases = UseCase.query.filter_by(filename=filename).order_by(UseCase.created_at.desc()).all()
    
    return jsonify([{
        'id': case.id,
        'name': case.name,
        'description': case.description,
        'tag': case.tag,
        'task_type': case.task_type,
        'created_at': case.created_at.strftime('%Y-%m-%d %H:%M')
    } for case in cases])

@use_case_bp.route('User_case/experiment')
def experiment():
    use_case_id = request.args.get('use_case_id')
    
    # Retrieve the use case data from the database
    use_case_data = UseCase.query.get(use_case_id)
    
    # Check if the use case exists
    if not use_case_data:
        abort(404)  # Or redirect to an error page
    
    # Pass the data to the template
    return render_template('/User_case/experimentpage.html', 
                           use_case=use_case_data,  # Name consistent with the template
                           filename=use_case_data.filename)

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

# Other routes...
@use_case_bp.route('/Use_case/data')
def data():
    return render_template("/Use_case/data.html")

@use_case_bp.route('/Use_case/flow')
def flow():
    return render_template('/Use_case/newprojet.html', active_tab='Flow')

@use_case_bp.route('/Use_case/newexperiment')
def newexperiment():
    return render_template('/Use_case/flow-table.html')

@use_case_bp.route('/Use_case/contenudata')
def contenudata():
    files = os.listdir(current_app.config['UPLOAD_FOLDER'])
    return render_template('/Use_case/contenudata.html', files=files)

@use_case_bp.route('/dashboard')
def dashboard():
    powerbi_url = "https://app.powerbi.com/reportEmbed?reportId=2fcbf768-81c5-40f3-8cf3-178f9f71abef&autoAuth=true&ctid=8b2b997e-5006-4d79-8773-e9d2f9b74857"
    return render_template("dashboard.html", report_url=powerbi_url)
