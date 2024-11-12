import json
import requests
import time

def get_artist_data():
    total_artists = 77492  # Nombre total d'artistes à récupérer
    start = 0  # Index de départ
    artist_dict = {}

    while start < total_artists:
        # URL pour accéder aux données des artistes dans WASABI
        url = f'https://wasabi.i3s.unice.fr/api/v1/artist_all/{start}'

        # Essayer de récupérer les données
        response = requests.get(url)

        if response.status_code == 200:
            artists_data = response.json()

            if not artists_data:  # Si la liste est vide, on arrête la boucle
                break

            for artist in artists_data:
                artist_id = artist['_id']
                artist_name = artist['name']

                # Ajout de l'artiste au dictionnaire
                artist_dict[artist_id] = {
                    'name': artist_name,
                    'albums': []
                }

                # Récupération des albums et des musiques
                for album in artist['albums']:
                    album_id = album['_id']
                    album_genre = album['genre']

                    # Ajout de l'album au dictionnaire de l'artiste sans le champ 'name'
                    artist_dict[artist_id]['albums'].append({
                        'id_album': album_id,
                        'genre': album_genre,
                        'musics': []
                    })

                    # Ajout des musiques de l'album
                    for music in album['songs']:
                        music_id = music['_id']
                        music_rank = music.get('rank')
                        music_title = music.get('title', 'Unknown')  # Titre de la musique ou "Unknown" par défaut

                        # Ajout des informations de la musique au dictionnaire de l'album
                        for album_info in artist_dict[artist_id]['albums']:
                            if album_info['id_album'] == album_id:
                                album_info['musics'].append({
                                    'id_music': music_id,
                                    'rank': music_rank,
                                    'title': music_title
                                })

            # Affichage de l'avancement
            progress = (start + len(artists_data)) / total_artists * 100
            print(f"Progress: {progress:.2f}% ({start + len(artists_data)}/{total_artists})")

            # Mise à jour de `start` pour passer aux 200 artistes suivants
            start += len(artists_data)

        else:
            print(f"Erreur lors de la récupération des données: Code d'erreur {response.status_code}. Réessayer dans 5 secondes...")
            time.sleep(5)  # Attendre 5 secondes avant de réessayer

    # Enregistrement des données dans un fichier JSON
    with open('artist_music_ranks.json', 'w', encoding='utf-8') as json_file:
        json.dump(artist_dict, json_file, ensure_ascii=False, indent=4)

    print("Les données des ranks et titres de musique ont été enregistrées dans 'artist_music_ranks.json'.")
    return artist_dict

# Exemple d'utilisation
artist_data = get_artist_data()
