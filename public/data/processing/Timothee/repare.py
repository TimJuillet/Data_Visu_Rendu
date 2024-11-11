# filtered_artists.json is poorly formatted
# it lacks the [ ] brackets to make it a list of dictionaries and the , commas to separate the dictionaries
# each entry is a line in the file

# format the file correctly

# open the file in read mode
with open('filtered_artists.json', 'r') as f:
    # read all the lines in the file
    lines = f.readlines()
    # open the file in write mode
    with open('formatted_artists.json', 'w') as f2:
        # write the opening bracket
        f2.write('[')
        # loop through all the lines
        for line in lines:
            # write the line to the new file
            f2.write(line)
            # write a comma on the same line if it is not the last line
            if line != lines[-1]:
                f2.write(',')
        # write the closing bracket
        f2.write(']')
        