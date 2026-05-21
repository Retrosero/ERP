#!/usr/bin/env python3
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
        return {'error': result.stdout.strip()}

def take_screenshot(filename, tab_id=None):
    args = {} if tab_id is None else {'tabId': tab_id}
    result = run_tool('screenshot', args)
    if 'content' in result:
        base64_data = result['content']
        if base64_data.startswith('data:image/png;base64,'):
            base64_data = base64_data.replace('data:image/png;base64,', '')
        filepath = os.path.join(os.environ['TEMP'], filename)
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(base64_data))
        return filepath
    return None

def get_tabs():
    result = run_tool('get_tabs', {})
    try:
        return json.loads(result.get('content', '[]'))
    except:
        return []

print("=== Current Browser Tabs ===")
tabs = get_tabs()
for tab in tabs:
    print(f"Tab {tab['id']}: {tab['title']} | {tab['url']}")

# Take screenshot
print("\n=== Taking screenshot ===")
screenshot = take_screenshot('browser_screenshot.png')
print(f"Screenshot saved: {screenshot}")