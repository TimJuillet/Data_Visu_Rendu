import json

# Load and print the JSON file
with open('formatted_artists.json', 'r', encoding='utf-8') as file:
    try:
        data = json.load(file)
        print(json.dumps(data, indent=4))  # Pretty print the JSON
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
