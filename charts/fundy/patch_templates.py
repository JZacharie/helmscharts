import os
import re

directory = "/home/joseph/git/helmscharts/charts/fundy/templates"

replacements = [
    (r'replicas: {{ .Values.replicaCount.([a-z]+) }}', 
     r'replicas: {{ index (.Values.replicaCount | default dict) "\1" | default 1 }}'),
    
    (r'image: "{{ .Values.images.([a-z]+).repository }}:{{ .Values.images.([a-z]+).tag }}"',
     r'image: "{{ index (.Values.images | default dict) "\1" | default (dict "repository" "") | .repository }}:{{ index (.Values.images | default dict) "\2" | default (dict "tag" "latest") | .tag }}"'),
    
    (r'imagePullPolicy: {{ .Values.images.([a-z]+).pullPolicy }}',
     r'imagePullPolicy: {{ index (.Values.images | default dict) "\1" | default (dict "pullPolicy" "IfNotPresent") | .pullPolicy }}'),
    
    (r'resources:\n\s+{{ - toYaml .Values.resources.([a-z]+) | nindent 12 }}',
     r'resources:\n          {{- index (.Values.resources | default dict) "\1" | default dict | toYaml | nindent 10 }}'),
    
    (r'value: {{ .Values.env.databases.([a-z]+) | quote }}',
     r'value: {{ index ((.Values.env | default dict).databases | default dict) "\1" | default "" | quote }}'),
    
    (r'containerPort: 80', r'containerPort: 80') # No change, just for reference
]

# Specifically for the hardcoded URLs if they missed any
url_pattern = re.compile(r'value: "http://fundy-([a-z]+):80')

for filename in os.listdir(directory):
    if filename.startswith("deployment-") and filename.endswith(".yaml"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Apply URL fix
        content = url_pattern.sub(r'value: "http://{{ include "fundy.fullname" . }}-\1-svc:80', content)
        
        # Apply other regex replacements
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
            
        with open(filepath, 'w') as f:
            f.write(content)

print("Done patching templates.")
