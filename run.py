from app import create_app
from extensions import db

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all() # <-- cette ligne doit être indenté
        print("✅ Base de données (re)créée avec succès.")
    app.run(debug=True, host='0.0.0.0')
