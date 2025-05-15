# utils.py
import os
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
 # Allowed file extensions

def get_safe_filepath(filename):
    """
    Retourne un chemin de fichier sécurisé dans le répertoire autorisé.
    
    Args:
        filename (str): Nom du fichier à sécuriser
        
    Returns:
        str: Chemin complet sécurisé vers le fichier
        
    Raises:
        ValueError: Si le filename est vide ou ne passe pas la validation
    """
    if not filename or not isinstance(filename, str):
        raise ValueError("Nom de fichier invalide")
    
    # Sécurise le nom de fichier (enlève les caractères dangereux)
    safe_name = secure_filename(filename)
    
    # Vérifie que le nom sécurisé n'est pas vide
    if not safe_name:
        raise ValueError("Nom de fichier non valide après sécurisation")
    
    # Chemin vers le répertoire de stockage (à configurer dans Flask)
    upload_dir = current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads')
    
    # Crée le répertoire s'il n'existe pas
    os.makedirs(upload_dir, exist_ok=True)
    
    # Construit le chemin complet
    full_path = os.path.join(upload_dir, safe_name)
    
    # Protection supplémentaire contre les directory traversal
    full_path = os.path.abspath(full_path)
    if not full_path.startswith(os.path.abspath(upload_dir)):
        raise ValueError("Tentative de traversal de répertoire détectée")
    
    return full_path
