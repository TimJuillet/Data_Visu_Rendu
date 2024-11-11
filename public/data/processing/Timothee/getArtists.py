import requests
import json

# Nom du fichier dans lequel enregistrer le JSON
json_filename = "artists4.json"

# Nombre total d'artistes
total_artists = 77492

# Nombre d'artistes à récupérer par requête
limit = 200

# Liste pour stocker tous les artistes
all_artists = []

# Boucle pour récupérer tous les artistes
for start in range(60000, total_artists, limit):
    # Construire l'URL avec le paramètre start
    url = f"https://wasabi.i3s.unice.fr/api/v1/artist_all/{start}"

    # Envoyer la requête GET pour récupérer les données JSON
    response = requests.get(url)

    # Vérifier si la requête a réussi
    if response.status_code == 200:
        # Charger les données JSON
        data = response.json()
        # Ajouter les données à la liste
        all_artists.extend(data)  # Ajouter les artistes récupérés à la liste
        print(f"Récupéré artistes de {start} à {start + limit}")
    else:
        print(f"Erreur {response.status_code}: Impossible de récupérer les données à partir de {start}")
        break  # Sortir de la boucle en cas d'erreur

# Enregistrer toutes les données dans un fichier JSON
with open(json_filename, 'w', encoding='utf-8') as jsonfile:
    json.dump(all_artists, jsonfile, ensure_ascii=False, indent=4)

print(f"Tous les artistes téléchargés et enregistrés sous '{json_filename}'.")