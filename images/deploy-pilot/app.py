import json
import subprocess
from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Load Configuration
with open('apps_config.json', 'r') as f:
    APPS = json.load(f)

def run_kubectl(args):
    """Run kubectl command and return output."""
    try:
        # Use existing service account credentials
        cmd = ['kubectl'] + args
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}\nOutput: {e.output}\nError: {e.stderr}")
        return None

def get_replicas(ns, name, kind):
    """Get current replicas for a resource."""
    # Try Deployment first if kind is generic or unknown
    kinds_to_try = [kind] if kind else ['Deployment', 'StatefulSet']
    
    for k in kinds_to_try:
        output = run_kubectl(['get', k, name, '-n', ns, '-o', 'jsonpath={.spec.replicas}'])
        if output is not None:
             # handle empty output (means 0 or failure to find field, but command success)
             if output == "": return "0"
             return output
    return "?"

@app.route('/')
def index():
    apps_status = []
    for a in APPS:
        name = a['name']
        ns = a['namespace']
        kind = a.get('kind', 'Deployment')
        
        current = get_replicas(ns, name, kind)
        apps_status.append({
            'name': name,
            'namespace': ns,
            'current': current,
            'kind': kind
        })
    return render_template('index.html', apps=apps_status)

@app.route('/scale/<name>/<int:replicas>', methods=['POST'])
def scale(name, replicas):
    # Find app
    target = next((a for a in APPS if a['name'] == name), None)
    if not target:
        return "App not found", 404
    
    ns = target['namespace']
    # Try scaling Deployment, if fails, try StatefulSet
    # We'll rely on what worked during 'get' or just try both.
    
    # Try Deployment
    cmd = ['scale', 'deployment', name, f'--replicas={replicas}', '-n', ns]
    try:
        subprocess.run(['kubectl'] + cmd, check=True)
    except subprocess.CalledProcessError:
        # Try StatefulSet
        cmd = ['scale', 'statefulset', name, f'--replicas={replicas}', '-n', ns]
        try:
             subprocess.run(['kubectl'] + cmd, check=True)
        except subprocess.CalledProcessError as e:
            return f"Failed to scale: {e}", 500
            
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
