#!/usr/bin/env bash
# Script d'installation des dépendances pour Render

echo "Installation des dépendances..."
pip install flask-login flask-sqlalchemy Werkzeug gunicorn

# Installation des autres dépendances depuis requirements.txt
pip install -r requirements.txt

echo "Dépendances installées avec succès"
