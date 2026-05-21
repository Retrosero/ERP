#!/usr/bin/env python3
import subprocess
import json
import os
import base64

# Test different JSON piping approaches for open_tab
test_url = "https://github.com/new"
active = True

json_data = json.dumps({"url": test_url, "active": active})
print(f"JSON data: {json_data}")

# Approach 1: PowerShell Write-Output
print("\n=== Approach 1: Write-Output ===")
cmd1 = f'Write-Output \'{json_data}\' | mavis browser tool open_tab'
r1 = subprocess.run(['powershell', '-NoProfile', '-Command', cmd1], capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r1.stdout.strip()}")
print(f"Stderr: {r1.stderr.strip()[:100]}")

# Approach 2: cmd /c echo (the one that worked before)
print("\n=== Approach 2: cmd /c echo (works for get_tabs) ===")
cmd2 = f'echo {json_data} | mavis browser tool open_tab'
r2 = subprocess.run(cmd2, shell=True, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r2.stdout.strip()}")
print(f"Stderr: {r2.stderr.strip()[:100]}")

# Approach 3: Direct stdin
print("\n=== Approach 3: Direct stdin ===")
cmd3 = ['powershell', '-NoProfile', '-Command', f'$input | mavis browser tool open_tab']
r3 = subprocess.run(cmd3, input=json_data + '\n', capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r3.stdout.strip()}")
print(f"Stderr: {r3.stderr.strip()[:100]}")