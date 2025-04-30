# setup.ps1

# Définir la variable d'environnement FLASK_APP
$env:FLASK_APP = "run.py"

# (Optionnel) Définir l'environnement en mode développement pour avoir le debug automatique
$env:FLASK_ENV = "development"

# Petit message sympa
Write-Host "✅cd Environnement Flask prêt ! Tu peux utiliser flask db init, flask run, etc."
