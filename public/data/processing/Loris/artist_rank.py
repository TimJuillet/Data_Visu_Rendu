import json
from collections import defaultdict

def calculate_top_artists_by_genre():
    # Lecture du fichier JSON
    with open('artist_with_final_ranks.json', 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Dictionnaire pour stocker les artistes par genre
    genre_top_artists = defaultdict(list)

    # Grouper les artistes par genre et trier par average_rank
    for artist_id, artist_info in data.items():
        average_rank = artist_info['average_rank']
        genres = artist_info['genres']

        # Prendre la partie entière du rank sans ajout de ".00"
        average_rank_int = int(average_rank)  # Convertir directement en entier

        # Ajouter chaque artiste à chaque genre auquel il appartient
        for genre in genres:
            genre_top_artists[genre].append({
                'artist_id': artist_id,
                'name': artist_info['name'],
                'average_rank': average_rank_int  # Utilisation de la partie entière
            })

    # Garder seulement les 5 artistes les plus hauts pour chaque genre
    for genre, artists in genre_top_artists.items():
        genre_top_artists[genre] = sorted(artists, key=lambda x: x['average_rank'], reverse=True)[:5]

    # Sauvegarder les données dans un fichier JSON pour utilisation avec D3.js
    with open('top_artists_by_genre.json', 'w', encoding='utf-8') as json_file:
        json.dump(genre_top_artists, json_file, ensure_ascii=False, indent=4)

# Exemple d'utilisation
calculate_top_artists_by_genre()
