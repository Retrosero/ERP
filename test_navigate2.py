#!/usr/bin/env python3
import subprocess
import json
import sys

# Test piping JSON to stdin
test_url = "https://github.com"
json_data = json.dumps({"url": test_url})

print(f"Sending JSON: {json_data}")

# Use PowerShell to pipe to mavis
cmd = ['powershell', '-Command', f'$json = \'{json_data}\'; $json | mavis browser tool navigate']
result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {result.stdout.strip()}")
print(f"Stderr: {result.stderr.strip()[:200] if result.stderr else 'None'}")