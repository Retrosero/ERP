#!/usr/bin/env python3
import subprocess
import json
import os

# Test using PowerShell directly with file approach
test_url = "https://github.com/new"
json_data = json.dumps({"url": test_url, "tabId": 1539273419})

print(f"Testing navigate with PowerShell file approach")
print(f"JSON: {json_data}")

# Write JSON to temp file
temp_file = os.path.join(os.environ['TEMP'], 'mavis_nav.json')
with open(temp_file, 'w') as f:
    f.write(json_data)

print(f"Temp file: {temp_file}")

# PowerShell command that reads from file and pipes to mavis
ps_cmd = f'''
Get-Content "{temp_file}" -Raw | mavis browser tool navigate
'''

r = subprocess.run(['powershell', '-NoProfile', '-Command', ps_cmd], capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r.stdout.strip()}")
print(f"Stderr: {r.stderr.strip()[:200]}")

# Cleanup
os.remove(temp_file)