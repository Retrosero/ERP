#!/usr/bin/env python3
"""
Coolify + GitHub Deployment Automation
"""
import subprocess
import json
import os
import base64
import time

def run_tool(tool_name, args_dict):
    """Run mavis browser tool."""
    json_data = json.dumps(args_dict)
    cmd = ['cmd', '/c', 'mavis', 'browser', 'tool', tool_name, json_data]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    try:
        return json.loads(result.stdout.strip())
    except:
        return {'error': result.stdout.strip() or result.stderr.strip()}

def get_tabs():
    """Get all browser tabs."""
    result = run_tool('get_tabs', {})
    try:
        return json.loads(result.get('content', '[]'))
    except:
        return []

def navigate(url, tab_id=None):
    """Navigate a tab to URL."""
    args = {'url': url}
    if tab_id:
        args['tabId'] = tab_id
    result = run_tool('navigate', args)
    print(f"      Navigate result: {result}")
    return result

def click(selector, tab_id=None):
    """Click an element."""
    args = {'selector': selector}
    if tab_id:
        args['tabId'] = tab_id
    result = run_tool('click', args)
    print(f"      Click result: {result}")
    return result

def type_text(selector, text, tab_id=None):
    """Type text into an element."""
    args = {'selector': selector, 'text': text}
    if tab_id:
        args['tabId'] = tab_id
    result = run_tool('type', args)
    print(f"      Type result: {result}")
    return result

def query(selector, mode='text', tab_id=None):
    """Query an element."""
    args = {'selector': selector, 'mode': mode}
    if tab_id:
        args['tabId'] = tab_id
    result = run_tool('query', args)
    print(f"      Query result: {result}")
    return result

def take_screenshot(filename='screenshot.png'):
    """Take a screenshot of active tab."""
    result = run_tool('screenshot', {})
    if 'content' in result:
        base64_data = result['content']
        if base64_data.startswith('data:image/png;base64,'):
            base64_data = base64_data.replace('data:image/png;base64,', '')
        filepath = os.path.join(os.environ['TEMP'], filename)
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(base64_data))
        print(f"      Screenshot saved: {filepath}")
        return filepath
    else:
        print(f"      Screenshot error: {result}")
    return None

# ============= MAIN =============
print("=" * 70)
print("   COOLIFY + GITHUB DEPLOYMENT")
print("=" * 70)

# Step 1: Get tabs
print("\n[1] Getting tabs...")
tabs = get_tabs()
coolify_tab = None
for tab in tabs:
    print(f"   {tab['id']}: {tab['url']} ({tab['title'][:30]})")
    if '72.61.119.147:8000' in tab['url'] and tab.get('active'):
        coolify_tab = tab

# Use the active Coolify tab
if coolify_tab:
    coolify_tab_id = coolify_tab['id']
else:
    # Find any Coolify tab
    for tab in tabs:
        if '72.61.119.147:8000' in tab['url']:
            coolify_tab_id = tab['id']
            break
    else:
        coolify_tab_id = None

print(f"\n   Using tab: {coolify_tab_id}")

# Step 2: Navigate to GitHub new repo
print("\n[2] Navigating to GitHub new repo...")
navigate('https://github.com/new', coolify_tab_id)
time.sleep(6)

# Step 3: Take screenshot
print("\n[3] Taking screenshot...")
take_screenshot('01_github_new.png')

# Step 4: Check page elements
print("\n[4] Checking page elements...")

# Try to find repository name input - GitHub new repo form
inputs = query('input', 'list', coolify_tab_id)
print(f"   Found inputs: {inputs}")

# Try to find form elements
forms = query('form', 'list', coolify_tab_id)
print(f"   Found forms: {forms}")

# Try clicking on repository name field with different selectors
print("\n[5] Trying to fill repository name...")
try:
    result = type_text('input[name="name"]', 'erp-panel', coolify_tab_id)
    time.sleep(1)
    take_screenshot('02_filled_repo_name.png')
except Exception as e:
    print(f"   Error: {e}")

# Try to click create repository button
print("\n[6] Clicking create repository button...")
click('button[type="submit"]', coolify_tab_id)
time.sleep(5)

# Take final screenshot
print("\n[7] Taking final screenshot...")
take_screenshot('03_after_create.png')

print("\n" + "=" * 70)
print("Done! Check your browser for results.")
print("=" * 70)