#!/usr/bin/env python3
import subprocess
import json
import os

# Test using a temp file to pass JSON
test_url = "https://github.com/new"
json_data = json.dumps({"url": test_url, "tabId": 1539273419})

print(f"Testing navigate with file approach")
print(f"JSON: {json_data}")

# Write JSON to temp file
temp_file = os.path.join(os.environ['TEMP'], 'mavis_nav.json')
with open(temp_file, 'w') as f:
    f.write(json_data)

print(f"Temp file: {temp_file}")

# Read from file and pipe to mavis
cmd = f'Get-Content "{temp_file}" | mavis browser tool navigate'
print(f"Command: {cmd}")

r = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r.stdout.strip()}")
print(f"Stderr: {r.stderr.strip()[:200]}")

# Cleanup
os.remove(temp_file)

# Try another approach - PowerShell file
print("\n=== Approach 2: PowerShell with file ===")
ps_script = f'''
$json = Get-Content -Path "{temp_file}" -Raw
$json | mavis browser tool navigate
'''
# Note: temp file already deleted, so recreate
with open(temp_file, 'w') as f:
    f.write(json_data)

ps_cmd = ['powershell', '-NoProfile', '-File', '-']
r2 = subprocess.run(ps_cmd, input=ps_script, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r2.stdout.strip()}")
print(f"Stderr: {r2.stderr.strip()[:200]}")

os.remove(temp_file)