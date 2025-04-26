"""
Script pour appliquer le correctif Tavily
Exécutez ce script avant de démarrer le serveur Flask
"""

import sys
import os

# Ajouter le répertoire parent au chemin Python
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    # Importer le correctif Tavily
    import tavily_fix
    print("Importation du correctif Tavily réussie")
    
    # Appliquer les remplacements de fonctions
    success = tavily_fix.replace_functions()
    
    if success:
        print("✅ CORRECTIF APPLIQUÉ : Les fonctions Tavily ont été remplacées avec succès")
        print("Vous pouvez maintenant générer des scripts sans obtenir d'erreur 500")
    else:
        print("❌ ÉCHEC : Le correctif n'a pas pu être appliqué")
except Exception as e:
    print(f"❌ ERREUR : {str(e)}")

print("\nPour démarrer le serveur Flask avec le correctif, exécutez :")
print("python apply_fix.py && python backend/app.py")
