#!/usr/bin/env python3
import subprocess
import json
import os
import base64

# Test different approaches for navigate tool
test_url = "https://github.com/new"
json_data = json.dumps({"url": test_url})
print(f"Testing navigate with URL: {test_url}")
print(f"JSON: {json_data}")

# Approach 1: cmd /c echo (this worked for get_tabs)
print("\n=== Approach 1: cmd /c echo ===")
cmd1 = f'echo {json_data} | mavis browser tool navigate'
r1 = subprocess.run(cmd1, shell=True, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r1.stdout.strip()}")
print(f"Stderr: {r1.stderr.strip()[:200]}")

# Approach 2: PowerShell Write-Output
print("\n=== Approach 2: PowerShell Write-Output ===")
cmd2 = f'Write-Output \'{json_data}\' | mavis browser tool navigate'
r2 = subprocess.run(['powershell', '-NoProfile', '-Command', cmd2], capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r2.stdout.strip()}")
print(f"Stderr: {r2.stderr.strip()[:200]}")

# Approach 3: Get current tabs first
print("\n=== Approach 3: Get active tab then navigate ===")
# First get tabs
tabs_result = subprocess.run('echo {} | mavis browser tool get_tabs', shell=True, capture_output=True, text=True, encoding='utf-8')
print(f"Tabs: {tabs_result.stdout.strip()[:200]}")

# Now try to navigate with tabId
json_data2 = json.dumps({"url": test_url, "tabId": 1539273419})
cmd3 = f'echo {json_data2} | mavis browser tool navigate'
r3 = subprocess.run(cmd3, shell=True, capture_output=True, text=True, encoding='utf-8')
print(f"Navigate with tabId: {r3.stdout.strip()}")
print(f"Stderr: {r3.stderr.strip()[:200]}")