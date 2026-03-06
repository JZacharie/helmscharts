#!/bin/bash
# =============================================================================
# Antigravity Docker - noVNC Startup Script
# =============================================================================
# Starts noVNC web server with auto-resize support
# =============================================================================

set -e

NOVNC_PORT="${NOVNC_PORT:-6080}"
VNC_PORT="${VNC_PORT:-5901}"
VNC_HOST="${VNC_HOST:-localhost}"

echo "[noVNC] Starting noVNC web server on port ${NOVNC_PORT}"
echo "[noVNC] Connecting to VNC server at ${VNC_HOST}:${VNC_PORT}"

# Wait for VNC server to be ready
echo "[noVNC] Waiting for VNC server..."
for i in $(seq 1 30); do
    if nc -z ${VNC_HOST} ${VNC_PORT} 2>/dev/null; then
        echo "[noVNC] VNC server is ready!"
        break
    fi
    echo "[noVNC] Waiting... ($i/30)"
    sleep 1
done

# Start noVNC with websockify
# --listen: Port for web browser connections
# --vnc: VNC server to connect to
# --web: Path to noVNC web files
exec /opt/websockify/run \
    --web /opt/novnc \
    --wrap-mode=ignore \
    ${NOVNC_PORT} \
    ${VNC_HOST}:${VNC_PORT}
