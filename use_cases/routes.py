from datetime import datetime
import os
from flask import Blueprint, json, request, jsonify, render_template, abort
from models import UseCase, UseCasePretrained
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
            filename=data['dataset'],
            target_column=data['target_column'] # Assurez-vous que ce champ est bien fourni
            # Si vous avez d'autres champs à ajouter, faites-le ici
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
    
    # Récupérer les cas d'utilisation normaux
    use_cases = UseCase.query.filter_by(filename=filename).all()
    # Récupérer les cas d'utilisation pré-entraînés
    pretrained_use_cases = UseCasePretrained.query.filter_by(filename=filename).all()
    
    # Convertir en JSON
    use_cases_data = [{
        'id': uc.id,
        'name': uc.name,
        'description': uc.description,
        'tag': uc.tag,
        'task_type': uc.task_type,
        'created_at': uc.created_at.strftime('%Y-%m-%d %H:%M'),
        'type': 'normal' ,
        'target_column': uc.target_column  # Ajouter la colonne cible                 
        # Ajouter un champ pour distinguer les types
    } for uc in use_cases]
    
    pretrained_data = [{
        'id': uc.id,
        'name': uc.name,
        'description': uc.description,
        'tag': uc.tag,
        'task_type': 'pretrained',  # Ou un autre identifiant pour les modèles pré-entraînés
        'created_at': uc.created_at.strftime('%Y-%m-%d %H:%M'),
        'type': 'pretrained'  # Ajouter un champ pour distinguer les types
    } for uc in pretrained_use_cases]
    
    # Combiner les deux listes
    all_use_cases = use_cases_data + pretrained_data
    
    return jsonify(all_use_cases)

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
        return jsonify({
            'success': True, 
            'message': 'Cas d\'utilisation supprimé avec succès',
            'id': use_case_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
        
        
@use_case_bp.route('/delete_pretrained_usecase', methods=['DELETE'])
def delete_pretrained_usecase():
    use_case_id = request.args.get('id')
    use_case = UseCasePretrained.query.get(use_case_id)
    
    if not use_case:
        return jsonify({'error': 'Use case not found'}), 404
        
    try:
        db.session.delete(use_case)
        db.session.commit()
        return jsonify({'message': 'Pretrained use case deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@use_case_bp.route('/update_usecase/<int:use_case_id>', methods=['PUT'])
def update_usecase(use_case_id):
    data = request.get_json()
    
    # Vérifier d'abord dans UseCase normal
    use_case = UseCase.query.get(use_case_id)
    is_pretrained = False
    
    # Si non trouvé, vérifier dans UseCasePretrained
    if not use_case:
        use_case = UseCasePretrained.query.get(use_case_id)
        is_pretrained = True
        if not use_case:
            return jsonify({'error': 'Cas d\'utilisation non trouvé'}), 404
    
    try:
        use_case.name = data['usecase_name']
        use_case.description = data['usecase_description']
        use_case.tag = data['usecase_tag']
        
        # Ne pas mettre à jour task_type pour les modèles pré-entraînés
        if not is_pretrained:
            use_case.task_type = data['task_type']
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Cas d\'utilisation mis à jour avec succès',
            'type': 'pretrained' if is_pretrained else 'normal'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@use_case_bp.route('/get_usecase_details')
def get_usecase_details():
    use_case_id = request.args.get('id')
    use_case_type = request.args.get('type', 'normal')  # Par défaut à 'normal'
    
    if not use_case_id:
        return jsonify({'error': 'ID de cas d\'utilisation requis'}), 400
    
    # Sélectionner le modèle approprié en fonction du type
    if use_case_type == 'pretrained':
        use_case = UseCasePretrained.query.get(use_case_id)
    else:
        use_case = UseCase.query.get(use_case_id)
    
    if not use_case:
        return jsonify({'error': 'Cas d\'utilisation non trouvé'}), 404
    
    # Construire la réponse de base
    response = {
        'id': use_case.id,
        'name': use_case.name,
        'description': use_case.description,
        'tag': use_case.tag,
        'task_type': use_case.task_type,
        'filename': use_case.filename,
        'created_at': use_case.created_at.strftime('%Y-%m-%d %H:%M'),
        'type': use_case_type
    }
    
    # Ajouter des champs spécifiques pour les modèles pré-entraînés
    if use_case_type == 'pretrained' and hasattr(use_case, 'model_path'):
        response['model_path'] = use_case.model_path
    
    return jsonify(response)

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
    return render_template('use_case/newprojet.html', use_case_id=use_case_id, filename=filename)

@use_case_bp.route('/create_pretrained_usecase', methods=['POST'])
def create_pretrained_usecase():
    try:
        # Vérifier si un fichier a été uploadé
        if 'model_file' not in request.files:
            return jsonify({'error': 'Aucun fichier modèle fourni'}), 400
            
        model_file = request.files['model_file']
        if model_file.filename == '':
            return jsonify({'error': 'Aucun fichier sélectionné'}), 400
            
        # Vérifier l'extension du fichier
        allowed_extensions = {'.joblib', '.h5', '.pkl', '.pb'}
        file_ext = os.path.splitext(model_file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Type de fichier non supporté'}), 400
            
        # Lire les données JSON
        data = json.loads(request.form.get('data', '{}'))
        
        # Enregistrer le fichier
        models_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'pretrained_models')
        os.makedirs(models_dir, exist_ok=True)
        model_path = os.path.join(models_dir, model_file.filename)
        model_file.save(model_path)
        
        # Créer le cas d'utilisation
        new_case = UseCasePretrained(
            name=data['usecase_name'],
            description=data['usecase_description'],
            tag=data['usecase_tag'],
            task_type='pretrained',
            filename=data['dataset'],
            model_path=model_path,
            target_column=data['target_column']  # Assurez-vous que ce champ est bien fourni

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