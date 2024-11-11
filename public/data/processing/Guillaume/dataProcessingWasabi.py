import requests
import pandas as pd
import json
from tqdm import tqdm
import json
import pandas as pd
import html  # Import to handle HTML entities
import re
import json
from collections import defaultdict
import pandas as pd
import json
from collections import defaultdict


api_url_dataset_info = "https://wasabi.i3s.unice.fr/search/dbinfo"
api_url_songs_fields = "https://wasabi.i3s.unice.fr/api/v1/_stats/song/count"



def downloadWithAPI(link: str, path: str, saving_name: str):
    response = requests.get(link)
    content_type = response.headers.get('Content-Type')

    if 'application/json' in content_type:
        try:
            songs = response.json()
            print("JSON data retrieved successfully.")
            path_file = path + '\\' + saving_name + ".json"
            with open(path_file, 'w') as json_file:
                json.dump(songs, json_file, indent=4)
        except ValueError:
            print("An error occurred while decoding the JSON.")

    elif 'text/csv' in content_type or 'text/plain' in content_type:
        print("The content is text/CSV.")
        csv_data = response.text
        path_file = path + '\\' + saving_name + ".csv"
        with open(path_file, 'w') as file:
            file.write(csv_data)
        print("The CSV file has been successfully saved.")

    else:
        print(f"Unexpected content format: {content_type}")

downloadWithAPI(api_url_dataset_info, "data\\processing", "dbinfo") #lyrics, artistname, idmusic,
downloadWithAPI(api_url_songs_fields, "data\\processing", "songsFields")

file_path = 'data\\origin\\wasabi_songs.csv'
header = pd.read_csv(file_path, sep='\t', nrows=0).columns.tolist()

columns_to_extract = ['_id', 'album_genre', 'publicationDateAlbum', 'artist']
chunksize = 100000
extracted_chunks = []
for chunk in pd.read_csv(file_path, sep='\t', usecols=columns_to_extract, chunksize=chunksize, on_bad_lines='skip'):
    extracted_chunks.append(chunk)
final_df = pd.concat(extracted_chunks, ignore_index=True)
final_df.to_json('data\\processing\\extracted_songs_fields.json', orient='records', lines=True)
print("Extraction completed and saved in 'extracted_songs_fields.json'.")

def clean_special_characters(data_dict):
    cleaned_data = {}
    for key, value in data_dict.items():
        if isinstance(value, str):
            cleaned_data[key] = value.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')
        else:
            cleaned_data[key] = value
    return cleaned_data

input_file_path = 'data\\processing\\extracted_songs_fields.json'
output_file_path = 'data\\processing\\cleaned_extracted_songs_fields.json'

with open(input_file_path, 'r', encoding='utf-8') as json_file:
    cleaned_data_list = []
    for line in json_file:
        try:
            data = json.loads(line.strip())
            cleaned_data = clean_special_characters(data)
            cleaned_data_list.append(cleaned_data)
        except json.JSONDecodeError:
            print(f"Failed to decode line: {line.strip()}")

with open(output_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(cleaned_data_list, json_file, ensure_ascii=False, indent=4)

print(f"Cleaning completed and saved in '{output_file_path}'.")


file_path = 'data\\origin\\wasabi_songs.csv'

columns_to_extract = ['_id', 'album_genre', 'publicationDateAlbum', 'artist']

# Read the file with tab separator, in chunks
chunksize = 100000  # Read in chunks of 100,000 rows

# List to store extracted chunks
extracted_chunks = []

# Function to extract the ObjectId from the '_id' field
def extract_objectid(value):
    if isinstance(value, str):
        match = re.match(r"ObjectId\((.*)\)", value)
        if match:
            return match.group(1)  # Return the hexadecimal part
    return value

# Function to remove '\u200e' from strings
def remove_unicode_control_characters(text):
    if isinstance(text, str):
        text.replace('\u200e', '')
        text.replace('\u200f', '')
        return text
    return text

# Function to validate and filter 'publicationDateAlbum' to keep only valid years (4 digits)
def validate_publication_date(value):
    if pd.isna(value) or value is None:  # Check for NaN/None
        return 'Unknown'
    try:
        # Convert float values by removing the decimal part
        if isinstance(value, float):
            value = str(int(value)).split('.')[0]  # Remove decimal part, even though int() takes care of it
        elif isinstance(value, str):
            # If it's a valid 4-digit string
            if re.match(r'^\d{4}$', value):
                return value
            # Handle float-like strings
            elif '.' in value:
                value = value.split('.')[0]
        # Ensure that value is a valid 4-digit year
        if len(value) == 4 and value.isdigit():
            return value
    except (ValueError, TypeError):
        return 'Unknown'
    return 'Unknown'  # Return 'Unknown' if validation fails

# Read data with Pandas using the separator '\t'
for chunk in pd.read_csv(file_path, sep='\t', usecols=columns_to_extract, chunksize=chunksize, on_bad_lines='skip'):
    # Remove any occurrences of '\u200e' in 'album_genre' and 'artist'
    chunk['album_genre'] = chunk['album_genre'].apply(lambda x: remove_unicode_control_characters(html.unescape(str(x))) if isinstance(x, str) else x)
    chunk['artist'] = chunk['artist'].apply(lambda x: remove_unicode_control_characters(html.unescape(str(x))) if isinstance(x, str) else x)

    # Transform '_id' field to extract only the hex part
    chunk['_id'] = chunk['_id'].apply(extract_objectid)

    # Validate 'publicationDateAlbum' and remove rows where the date is not a valid year (4 digits)
    chunk['publicationDateAlbum'] = chunk['publicationDateAlbum'].apply(validate_publication_date)
    chunk = chunk.dropna(subset=['publicationDateAlbum'])  # Remove rows with invalid dates

    # Add each chunk to the list
    extracted_chunks.append(chunk)

# Concatenate all chunks into a single DataFrame
final_df = pd.concat(extracted_chunks, ignore_index=True)

# Convert the DataFrame to a list of dictionaries
data_list = final_df.to_dict(orient='records')

# Write the list of dictionaries to a JSON file
with open('data\\processing\\songs_data.json', 'w', encoding='utf-8') as json_file:
    json.dump(data_list, json_file, indent=4)

print("Extraction completed and saved to 'songs_data.json'.")



# Charger les données du fichier JSON
with open('data\\processing\\songs_data.json', 'r') as file:
    songs = json.load(file)

# Initialiser le dictionnaire pour compter les occurrences
song_count = defaultdict(int)
unique_genres = set()

# Parcourir les chansons et compter par couple (releaseDate, genre)
for song in songs:
    # Obtenir publicationDateAlbum et le traiter
    release_date = str(song.get('publicationDateAlbum')) or 'Unknown'

    # Convertir les années au format float en chaînes entières
    release_date = release_date.split('.')[0]
    genres = str(song.get('album_genre')) or ['Unknown']  # Utiliser 'Unknown' si genre est null
    artist = str(song.get('artist')) or ['Unknown']

    if isinstance(release_date, list):
        release_date = tuple(release_date)

    if isinstance(genres, list):
        for genre in genres :
            genre.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')
            key = (release_date, genre)
            song_count[key] += 1
        unique_genres.update(genres)
    else:
        genres = genres.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')
        key = (release_date, genres)
        song_count[key] += 1
        unique_genres.add(genres)

# Convertir le dictionnaire en DataFrame
df = pd.DataFrame(song_count.items(), columns=['Release Date and Genre', 'Count'])

# Séparer les clés en deux colonnes
df[['Release Date', 'Genre']] = pd.DataFrame(df['Release Date and Genre'].tolist(), index=df.index)

# Supprimer la colonne initiale des clés
df = df.drop(columns=['Release Date and Genre'])

# Trier par Release Date puis par Genre
df = df.sort_values(by=['Release Date', 'Genre']).reset_index(drop=True)

# Enregistrer le DataFrame dans un fichier CSV
df.to_csv('data\\processing\\song_count.csv', index=False, encoding='utf-8')

print("Données enregistrées dans data\\processing\\song_count.csv.")



# Charger les données du fichier JSON
with open('data\\processing\\songs_data.json', 'r') as file:
    songs = json.load(file)

# Initialiser le dictionnaire pour compter les occurrences par couple (releaseDate, genre)
song_count = defaultdict(lambda: {'total': 0, 'artists': defaultdict(int)})

# Parcourir les chansons et compter par couple (releaseDate, genre)
for song in songs:
    # Obtenir publicationDateAlbum et le traiter
    release_date = str(song.get('publicationDateAlbum')) or 'Unknown'

    # Convertir les années au format float en chaînes entières
    release_date = release_date.split('.')[0]
    genres = str(song.get('album_genre')) or 'Unknown'  # Utiliser 'Unknown' si genre est null
    artist = str(song.get('artist')) or 'Unknown'

    artist = artist.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')

    # Si plusieurs genres sont associés à la chanson
    if isinstance(genres, list):
        for genre in genres:
            genre = genre.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')
            song_count[(release_date, genre)]['total'] += 1
            song_count[(release_date, genre)]['artists'][artist] += 1
    else:
        # Un seul genre
        genres = genres.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')
        song_count[(release_date, genres)]['total'] += 1
        song_count[(release_date, genres)]['artists'][artist] += 1

# Préparer les données pour les sauvegarder dans un fichier JSON
formatted_data = {}
for (release_date, genre), data in song_count.items():
    formatted_data[f"{release_date}, {genre}"] = [data['total'], data['artists']]

# Enregistrer le dictionnaire formaté dans un fichier JSON
with open('data\\processing\\formatted_song_data.json', 'w', encoding='utf-8') as outfile:
    json.dump(formatted_data, outfile, ensure_ascii=False, indent=4)

print("Données enregistrées dans formatted_song_data.json.")

import json

# Charger les données du fichier formatted_song_data.json
file_path = 'data\\processing\\formatted_song_data.json'
with open(file_path, 'r', encoding='utf-8') as json_file:
    songs_data = json.load(json_file)

# Fonction pour gérer l'encodage (cette fonction n'est plus nécessaire si tu utilises ensure_ascii=False)
def handle_encoding(value):
    try:
        return value.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return value  # Si une erreur d'encodage se produit, retourner la valeur telle quelle

# Fonction pour traiter les genres et ajouter les genres associés
def process_genre(genre, release_date, count, artists, dict1, dict2):
    parts = genre.split()
    matched_in_dict1 = False

    for part in parts:
        # Vérifier si le tuple (part, release_date) est dans dict1
        if (part, release_date) in dict1:
            current_count, genre_set, artist_dict = dict1[(part, release_date)]
            dict1[(part, release_date)] = (current_count + count, genre_set | {genre}, {**artist_dict, **artists})
            matched_in_dict1 = True

        # Vérifier si le tuple (part, release_date) est dans dict2
        elif (part, release_date) in dict2:
            current_count, genre_set, artist_dict = dict2[(part, release_date)]
            dict2[(part, release_date)] = (current_count + count, genre_set | {genre}, {**artist_dict, **artists})

            # Si plusieurs genres sont associés à cette partie, déplacer dans dict1
            if len(genre_set) >= 1:
                dict1[(part, release_date)] = dict2.pop((part, release_date))
            matched_in_dict1 = True

    # Si aucune partie n'a été trouvée dans dict1 ou dict2, l'ajouter à dict2
    if not matched_in_dict1:
        for part in parts:
            if (part, release_date) not in dict2:
                dict2[(part, release_date)] = (count, {genre}, artists)
    return dict1

# Initialiser dict1 et dict2
dict1 = {}
dict2 = {}

# Parcourir les données du fichier JSON
for key, value in songs_data.items():
    release_date_genre = key  # Clé est du type "2008, Pop"
    count = value[0]  # Le nombre total de chansons
    artists = value[1]  # Dictionnaire des artistes et leur nombre de chansons

    # Traiter les genres et ajouter à dict1 ou dict2
    release_date, genre = release_date_genre.split(", ")
    process_genre(genre, release_date, count, artists, dict1, dict2)

# Convertir dict1 en un format compatible avec JSON (les ensembles sont convertis en listes)
dict1_json_ready = {str(k): (v[0], list(v[1]), v[2]) for k, v in dict1.items()}

# Sauvegarder dict1 dans un fichier JSON en utilisant ensure_ascii=False pour éviter les encodages échappés
output_json_path = 'data\\Guillaume.json'
with open(output_json_path, 'w', encoding='utf-8') as json_output:
    json.dump(dict1_json_ready, json_output, ensure_ascii=False, indent=4)

print(f"Dictionary 1 saved to {output_json_path}")






# Charger les données du fichier formatted_song_data.json
file_path_songs = 'data\\processing\\formatted_song_data.json'
with open(file_path_songs, 'r', encoding='utf-8') as json_file:
    songs_data = json.load(json_file)

# Charger les données du fichier Timothée.json
file_path_artists = 'data\\Timothee.json'
with open(file_path_artists, 'r', encoding='utf-8') as json_file:
    artist_location_data = json.load(json_file)

# Construire un dictionnaire qui associe chaque artiste à son pays
artist_to_country = {}
for artist_info in artist_location_data:
    artist_name = artist_info["name"]
    country = artist_info["location"]["country"]
    artist_to_country[artist_name] = country

# Initialiser le dictionnaire pour la structure finale
country_dict = {}

# Fonction pour traiter chaque genre, année, sous-genre, et artiste
def process_genre_data(genre, year, artists, country_dict):
    # Déterminer le genre principal (dernier mot) et sous-genre
    genre_parts = genre.split(" ")
    main_genre = genre_parts[-1]  # Le dernier mot est le genre principal
    subgenre = genre  # Le sous-genre est le genre complet

    for artist, artist_count in artists.items():
        # Trouver le pays de l'artiste
        country = artist_to_country.get(artist, "Unknown")

        # Initialiser la structure pour le pays s'il n'existe pas encore
        if country not in country_dict:
            country_dict[country] = {}

        # Initialiser la structure pour le genre principal
        if main_genre not in country_dict[country]:
            country_dict[country][main_genre] = {}

        # Initialiser l'année sous le genre principal
        if year not in country_dict[country][main_genre]:
            country_dict[country][main_genre][year] = [0, {}]  # [total_count, subgenres_dict]

        # Ajouter ou mettre à jour les sous-genres et artistes dans subgenres_dict
        subgenre_dict = country_dict[country][main_genre][year][1]
        if subgenre not in subgenre_dict:
            subgenre_dict[subgenre] = [0, {}]  # [subgenre_total_count, artists_dict]

        # Mettre à jour le nombre de chansons de chaque artiste pour le sous-genre
        if artist in subgenre_dict[subgenre][1]:
            subgenre_dict[subgenre][1][artist] += artist_count
        else:
            subgenre_dict[subgenre][1][artist] = artist_count

        # Mettre à jour le nombre total de chansons (somme des chansons pour chaque artiste)
        country_dict[country][main_genre][year][0] += artist_count
        subgenre_dict[subgenre][0] += artist_count  # Mettre à jour le total pour le sous-genre

# Parcourir les données du fichier JSON et les traiter
for key, value in songs_data.items():
    release_date_genre = key  # Clé est du type "2008, Pop"
    artists = value[1]  # Dictionnaire des artistes et leur nombre de chansons

    # Extraire l'année et le genre
    release_date, genre = release_date_genre.split(", ")
    process_genre_data(genre, release_date, artists, country_dict)

# Sauvegarder country_dict dans un fichier JSON sans convertir subgenres en liste
output_json_path = 'data\\Guillaume2.json'
with open(output_json_path, 'w', encoding='utf-8') as json_output:
    json.dump(country_dict, json_output, ensure_ascii=False, indent=4)

print(f"Dictionary saved to {output_json_path}")
