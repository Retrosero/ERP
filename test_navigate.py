#!/usr/bin/env python3
import subprocess
import json

# Test the navigate tool with different approaches
test_url = "https://github.com"

# Test 1: Direct echo
print("Test 1: Direct echo with double quotes")
cmd1 = ['cmd', '/c', f'echo {{"url":"{test_url}"}} | mavis browser tool navigate']
r1 = subprocess.run(cmd1, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r1.stdout.strip()}")
print(f"Stderr: {r1.stderr.strip()[:200] if r1.stderr else 'None'}")
print()

# Test 2: JSON with escaped quotes
print("Test 2: With escaped quotes")
cmd2 = ['cmd', '/c', f'echo \\"{{\\"url\\":\\"{test_url}\\"}}\\" | mavis browser tool navigate']
r2 = subprocess.run(cmd2, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r2.stdout.strip()}")
print()

# Test 3: Using stdin with pipe
print("Test 3: Using stdin directly")
cmd3 = f'echo {{"url":"{test_url}"}} | mavis browser tool navigate'
r3 = subprocess.run(cmd3, shell=True, capture_output=True, text=True, encoding='utf-8')
print(f"Result: {r3.stdout.strip()}")