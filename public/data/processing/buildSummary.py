import json
import csv

# Charger le fichier JSON
with open('../Guillaume2.json', 'r', encoding='utf-8') as json_file:
    data = json.load(json_file)

# Préparer les données pour le CSV
rows = []

for country, genres in data.items():
    for genre, years in genres.items():
        for year, (nbSongs, _) in years.items():
            # Construire une ligne avec les informations extraites
            rows.append({
                "country": country,
                "year": year,
                "genre": genre,
                "nbSongs": nbSongs
            })

# Écrire dans le fichier CSV
with open('../summary.csv', 'w', newline='', encoding='utf-8') as csv_file:
    fieldnames = ["country", "year", "genre", "nbSongs"]
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

    writer.writeheader()  # Écrire l'en-tête du CSV
    writer.writerows(rows)  # Écrire toutes les lignes extraites

print("Le fichier CSV a été créé avec succès sous le nom 'data.csv'.")
