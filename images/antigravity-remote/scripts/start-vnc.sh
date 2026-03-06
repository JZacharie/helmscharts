#!/bin/bash
# =============================================================================
# Antigravity Docker - VNC Server Startup Script
# =============================================================================
# Starts TigerVNC server with dynamic resolution support
# =============================================================================

set -e

# Configuration
DISPLAY_NUM="${DISPLAY_NUM:-1}"
DISPLAY_WIDTH="${DISPLAY_WIDTH:-1920}"
DISPLAY_HEIGHT="${DISPLAY_HEIGHT:-1080}"
DISPLAY_DEPTH="${DISPLAY_DEPTH:-24}"

echo "[VNC] Starting TigerVNC server on display :${DISPLAY_NUM}"
echo "[VNC] Initial resolution: ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x${DISPLAY_DEPTH}"

# Kill any existing VNC servers
vncserver -kill :${DISPLAY_NUM} 2>/dev/null || true
rm -rf /tmp/.X${DISPLAY_NUM}-lock /tmp/.X11-unix/X${DISPLAY_NUM} 2>/dev/null || true

# Start VNC server with the following options:
# -geometry: Initial screen resolution
# -depth: Color depth
# -localhost no: Allow connections from all interfaces (noVNC needs this)
# -SecurityTypes: Use password authentication
# -rfbport: VNC port
exec vncserver :${DISPLAY_NUM} \
    -geometry ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT} \
    -depth ${DISPLAY_DEPTH} \
    -localhost no \
    -SecurityTypes VncAuth \
    -rfbport ${VNC_PORT:-5901} \
    -fg \
    -xstartup ~/.vnc/xstartup
