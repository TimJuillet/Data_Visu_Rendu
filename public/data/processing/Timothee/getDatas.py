import pandas as pd
import json

# Load the JSON data into a pandas DataFrame
artist_data = pd.read_json('Dataset/artists.json')
artist_data.rename(columns={'_id': 'artist_json_id'}, inplace=True)

# Prepare an empty list to store the merged results
merged_data_list = []

# Read the CSV data in chunks and merge with the artist data
for chunk in pd.read_csv('Dataset/wasabi_songs.csv', sep='\t', chunksize=100000, on_bad_lines='skip'):
    # Merge each chunk with the artist data
    merged_chunk = pd.merge(artist_data, chunk, left_on='name', right_on='artist')

    # Append the merged chunk to the list
    merged_data_list.append(merged_chunk)

# Concatenate all the merged chunks into a single DataFrame
merged_data = pd.concat(merged_data_list, ignore_index=True)

# Select the necessary columns: artist_name, song_id, genre, and location
output_data = merged_data[['name', '_id', 'genre', 'location']]

# Rename the 'name' column to 'artist_name'
output_data.rename(columns={'name': 'artist_name'}, inplace=True)

# Write the output data to a new JSON file 'data.json'
output_data.to_json('data.json', orient='records', indent=4)
