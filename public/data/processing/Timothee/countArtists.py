# count the number of artists in Dataset/artists.json

import json

with open('artists.json') as f:
    data = json.load(f)
    
print(len(data))