#!/usr/bin/env python3
"""Verify GitHub repo creation and navigate to Coolify"""
import subprocess
import json
import os
import base64

def run_tool(tool_name, args_dict):
    json_data = json.dumps(args_dict)
    cmd = ['cmd', '/c', 'mavis', 'browser', 'tool', tool_name, json_data]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    try:
        return json.loads(result.stdout.strip())
    except:
        return {'error': result.stdout.strip() or result.stderr.strip()}

def get_tabs():
    result = run_tool('get_tabs', {})
    try:
        return json.loads(result.get('content', '[]'))
    except:
        return []

def take_screenshot(filename='screenshot.png'):
    result = run_tool('screenshot', {})
    if 'content' in result:
        base64_data = result['content']
        if base64_data.startswith('data:image/png;base64,'):
            base64_data = base64_data.replace('data:image/png;base64,', '')
        filepath = os.path.join(os.environ['TEMP'], filename)
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(base64_data))
        return filepath
    return None

# Check current tabs
print("=== Current Browser Tabs ===")
tabs = get_tabs()
github_repo_tab = None
coolify_tab = None

for tab in tabs:
    print(f"Tab {tab['id']}: {tab['title']} | {tab['url']}")
    if 'Retrosero/erp-panel' in tab['url']:
        github_repo_tab = tab
    if 'github.com/Retrosero' in tab['url'] and 'erp-panel' in tab['url']:
        github_repo_tab = tab
    if 'coolify' in tab['url'].lower():
        coolify_tab = tab

print(f"\nGitHub repo tab: {github_repo_tab}")
print(f"Coolify tab: {coolify_tab}")

# Take screenshot
print("\n=== Taking screenshot ===")
screenshot = take_screenshot('final_check.png')
print(f"Screenshot: {screenshot}")