import json
import os

files = os.listdir('./')
files.remove("schedule.json")
files.remove('merge.py')

schedule = {}

for file in files:
    with open(file, 'r') as f:
        sch = json.load(f)
        weekday = ""
        for ch in file:
            if ch == '.':
                break
            weekday += ch
        schedule[weekday] = sch


with open('schedule.json', 'w') as f:
    f.write(json.dumps(schedule))

