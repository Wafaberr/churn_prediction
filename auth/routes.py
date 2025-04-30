from sqlite3 import IntegrityError
from flask import Blueprint, current_app, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user, login_required
from flask_mail import Message
from itsdangerous import Serializer, SignatureExpired
from models import User  # Assurez-vous que le fichier models.py est dans le même répertoire
from extensions import db, mail
from models import User  # Assurez-vous que le fichier models.py est dans le même répertoire
auth = Blueprint('auth', __name__)

# Route de connexion
@auth.route('/authentification/connexion', methods=['GET', 'POST'])
def connexion():
    if current_user.is_authenticated:
        return redirect(url_for('home'))  # Vérifie que 'home' est bien défini sans blueprint, sinon adapte

    if request.method == 'POST':
        action = request.form.get('action')
        email = request.form.get('email')
        password = request.form.get('password')

        if action == 'login':
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                login_user(user)
                return redirect(url_for('home'))
            flash("Email ou mot de passe incorrect.", "danger")

        elif action == 'register':
            name = request.form.get('name')
            phone = request.form.get('phone')
            confirm_password = request.form.get('confirm_password')

            if password != confirm_password:
                flash("Les mots de passe ne correspondent pas.", "warning")
            elif User.query.filter_by(email=email).first():
                flash("Un compte avec cet email existe déjà.", "warning")
            else:
                new_user = User(name=name, phone=phone, email=email)
                new_user.set_password(password)
                try:
                    db.session.add(new_user)
                    db.session.commit()
                    flash("Compte créé avec succès ! Connecte-toi maintenant.", "success")
                except IntegrityError:
                    db.session.rollback()
                    flash("Erreur lors de l'enregistrement. Réessaie.", "danger")

    return render_template("authentification/connexion.html")

# Route de déconnexion
@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.connexion'))  # <- ici c'est bon car connexion est dans auth

# Route de réinitialisation du mot de passe (mot de passe oublié)
@auth.route('/authentification/forgot_pass', methods=['GET', 'POST'])
def forgot_pass():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()

        if user:
            # Si l'utilisateur existe, générer un token et envoyer un email
            token = generate_reset_token(user)
            send_reset_email(user, token)
            flash('Un e-mail de réinitialisation a été envoyé!', 'info')
            return redirect(url_for('auth.connexion'))
        else:
            flash("Aucun utilisateur trouvé avec cet e-mail.", 'danger')
            
    return render_template('authentification/forgot_pass.html')
#    

# Générer le token pour la réinitialisation

def generate_reset_token(user, expires_sec=1800):
    from itsdangerous import URLSafeTimedSerializer
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return s.dumps({'user_id': user.id})

# Envoyer l'e-mail avec le lien de réinitialisation
def send_reset_email(user, token):
    msg = Message('Réinitialiser votre mot de passe', sender='noreply@demo.com', recipients=[user.email])
    msg.body = f'''Pour réinitialiser votre mot de passe, suivez ce lien :
{url_for('auth.reset_password', token=token, _external=True)}
Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.
'''
    mail.send(msg)

# Route de réinitialisation du mot de passe
@auth.route('/authentification/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        user_id = verify_reset_token(token)
    except SignatureExpired:
        flash('Le token a expiré!', 'warning')
        return redirect(url_for('auth.forgot_pass'))
    user = User.query.get(user_id)
    if user:
        if request.method == 'POST':
            new_password = request.form.get('password')
            user.set_password(new_password)
            db.session.commit()
            flash('Votre mot de passe a été mis à jour!', 'success')
            return redirect(url_for('auth.connexion'))

    return render_template('authentification/reset_password.html')

def verify_reset_token(token):
    from itsdangerous import URLSafeTimedSerializer
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        data = s.loads(token, max_age=1800)
    except SignatureExpired:
        raise SignatureExpired('Le token a expiré')
    return data['user_id']
