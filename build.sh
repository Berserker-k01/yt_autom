#!/usr/bin/env bash
# Script d'installation des dépendances pour Render

echo "Installation des dépendances..."

# Installer psycopg2-binary en premier pour éviter les problèmes
echo "Installation explicite de psycopg2-binary..."
pip install psycopg2-binary==2.9.6

# Installer les dépendances de base
echo "Installation des dépendances Flask..."
pip install flask-login flask-sqlalchemy Werkzeug gunicorn

# Installation des autres dépendances depuis requirements.txt
echo "Installation des autres dépendances..."
pip install -r requirements.txt

# Vérifier que psycopg2 est bien installé
echo "Vérification de l'installation de psycopg2..."
pip show psycopg2-binary

echo "Dépendances installées avec succès"
