import yaml
import sys

files_to_remove = ['bolt-diy', 'crewai', 'foxops', 'polaris', 'wud']

try:
    with open('index.yaml', 'r') as f:
        data = yaml.safe_load(f)

    if 'entries' in data:
        for name in files_to_remove:
            if name in data['entries']:
                del data['entries'][name]
                print(f"Removed {name}")
            else:
                print(f"{name} not found in entries")
    
    with open('index.yaml', 'w') as f:
        yaml.dump(data, f, default_flow_style=False)
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
