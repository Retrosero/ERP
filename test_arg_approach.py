#!/usr/bin/env python3
import subprocess
import json

# Test passing JSON as argument directly (not via stdin)
test_url = "https://github.com/new"
json_data = json.dumps({"url": test_url})

print(f"Testing with JSON as argument")
print(f"JSON: {json_data}")

# Try passing JSON as argument (using mavis.cmd)
cmd = ['cmd', '/c', 'mavis', 'browser', 'tool', 'navigate', json_data]
print(f"Command: mavis browser tool navigate {json_data}")

r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r.stdout.strip()}")
print(f"Stderr: {r.stderr.strip()[:200]}")

# Try single command string
print("\n=== Single command string ===")
cmd2 = f'mavis browser tool navigate {json_data}'
print(f"Command: {cmd2}")

r2 = subprocess.run(cmd2, shell=True, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r2.stdout.strip()}")
print(f"Stderr: {r2.stderr.strip()[:200]}")