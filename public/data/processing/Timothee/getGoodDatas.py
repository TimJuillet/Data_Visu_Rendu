import json
import pandas as pd

def process_json_file(input_file, output_file):
    try:
        with open(input_file, 'r') as infile:
            # Read the entire file as one JSON object
            data = json.load(infile)
            
            # Check if the data is a list of dictionaries or a single dictionary
            if isinstance(data, list):
                for item in data:
                    process_item(item, output_file)
            elif isinstance(data, dict):
                process_item(data, output_file)
            else:
                print(f"Unexpected data format in {input_file}")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON in file {input_file}: {e}")

def process_item(item, output_file):
    # Extract only the 'name' and 'location' attributes if they exist
    if 'name' in item and 'location' in item:
        result = {
            'name': item['name'],
            'location': item['location']
        }
        # Write the result to the output file in append mode
        with open(output_file, 'a') as outfile:
            json.dump(result, outfile)
            outfile.write('\n')

def process_multiple_files(file_list, output_file):
    # Clear the output file if it exists
    open(output_file, 'w').close()
    for file_name in file_list:
        print(f"Processing file: {file_name}")
        process_json_file(file_name, output_file)

# List of JSON files to process
json_files = ['artists.json', 'artists2.json', 'artists3.json', 'artists4.json']
output_json = 'filtered_artists.json'

# Process each JSON file and save the result
process_multiple_files(json_files, output_json)
print(f"Data written to {output_json}")