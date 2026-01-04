from flask import Flask, jsonify, request
from flask_cors import CORS
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from datetime import datetime
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load Kubernetes config
try:
    # Try in-cluster config first
    config.load_incluster_config()
    logger.info("Loaded in-cluster Kubernetes config")
except:
    # Fall back to kubeconfig
    config.load_kube_config()
    logger.info("Loaded kubeconfig")

# Initialize Kubernetes clients
v1 = client.CoreV1Api()
apps_v1 = client.AppsV1Api()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200


@app.route('/api/status/<namespace>/<deployment>', methods=['GET'])
def get_deployment_status(namespace, deployment):
    """
    Get the status of a deployment and its pods
    
    Returns:
        {
            "deployment": str,
            "namespace": str,
            "replicas": int,
            "readyReplicas": int,
            "phase": str,  # Pending, Running, Succeeded, Failed, Unknown
            "ready": bool,
            "podName": str,
            "conditions": list
        }
    """
    try:
        # Get deployment
        deploy = apps_v1.read_namespaced_deployment(deployment, namespace)
        
        replicas = deploy.spec.replicas or 0
        ready_replicas = deploy.status.ready_replicas or 0
        
        # Get pods for this deployment
        label_selector = ','.join([f"{k}={v}" for k, v in deploy.spec.selector.match_labels.items()])
        pods = v1.list_namespaced_pod(namespace, label_selector=label_selector)
        
        # Determine overall status
        phase = "Unknown"
        pod_name = None
        ready = False
        
        if pods.items:
            # Get the most recent pod
            latest_pod = max(pods.items, key=lambda p: p.metadata.creation_timestamp)
            pod_name = latest_pod.metadata.name
            phase = latest_pod.status.phase
            
            # Check if pod is ready
            if latest_pod.status.conditions:
                for condition in latest_pod.status.conditions:
                    if condition.type == "Ready" and condition.status == "True":
                        ready = True
                        break
        
        # Get deployment conditions
        conditions = []
        if deploy.status.conditions:
            conditions = [
                {
                    "type": c.type,
                    "status": c.status,
                    "reason": c.reason,
                    "message": c.message
                }
                for c in deploy.status.conditions
            ]
        
        return jsonify({
            "deployment": deployment,
            "namespace": namespace,
            "replicas": replicas,
            "readyReplicas": ready_replicas,
            "phase": phase,
            "ready": ready and ready_replicas > 0,
            "podName": pod_name,
            "conditions": conditions
        }), 200
        
    except ApiException as e:
        logger.error(f"Kubernetes API error: {e}")
        return jsonify({
            "error": "Deployment not found or access denied",
            "details": str(e)
        }), e.status
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


@app.route('/api/logs/<namespace>/<pod_name>', methods=['GET'])
def get_pod_logs(namespace, pod_name):
    """
    Get logs from a pod
    
    Query parameters:
        - tailLines: number of lines to return (default: 50)
        - sinceTime: ISO 8601 timestamp to get logs since
        - container: specific container name (optional)
    
    Returns:
        {
            "logs": list[str],
            "timestamp": str (ISO 8601)
        }
    """
    try:
        tail_lines = request.args.get('tailLines', default=50, type=int)
        since_time = request.args.get('sinceTime')
        container = request.args.get('container')
        
        # Build kwargs for log request
        kwargs = {
            'namespace': namespace,
            'name': pod_name,
            'tail_lines': tail_lines
        }
        
        if container:
            kwargs['container'] = container
        
        if since_time:
            # Parse ISO 8601 timestamp
            try:
                since_dt = datetime.fromisoformat(since_time.replace('Z', '+00:00'))
                # Calculate seconds since
                now = datetime.now(since_dt.tzinfo)
                since_seconds = int((now - since_dt).total_seconds())
                if since_seconds > 0:
                    kwargs['since_seconds'] = since_seconds
            except ValueError:
                logger.warning(f"Invalid timestamp format: {since_time}")
        
        # Get logs
        log_text = v1.read_namespaced_pod_log(**kwargs)
        
        # Split into lines and filter empty
        log_lines = [line for line in log_text.split('\n') if line.strip()]
        
        return jsonify({
            "logs": log_lines,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }), 200
        
    except ApiException as e:
        logger.error(f"Kubernetes API error: {e}")
        return jsonify({
            "error": "Pod not found or logs not available",
            "details": str(e)
        }), e.status
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


@app.route('/api/ready/<namespace>/<deployment>', methods=['GET'])
def check_ready(namespace, deployment):
    """
    Quick check if deployment is ready
    
    Returns:
        {
            "ready": bool,
            "readyReplicas": int,
            "targetReplicas": int
        }
    """
    try:
        deploy = apps_v1.read_namespaced_deployment(deployment, namespace)
        
        replicas = deploy.spec.replicas or 0
        ready_replicas = deploy.status.ready_replicas or 0
        
        return jsonify({
            "ready": ready_replicas > 0 and ready_replicas >= replicas,
            "readyReplicas": ready_replicas,
            "targetReplicas": replicas
        }), 200
        
    except ApiException as e:
        logger.error(f"Kubernetes API error: {e}")
        return jsonify({
            "error": "Deployment not found",
            "details": str(e)
        }), e.status
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
