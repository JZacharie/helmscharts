#!/bin/bash
# =============================================================================
# Antigravity Docker - Resolution Change Script
# =============================================================================
# Dynamically changes the VNC display resolution
# Usage: ./resize-display.sh 1920 1080
# =============================================================================

set -e

WIDTH="${1:-1920}"
HEIGHT="${2:-1080}"
DISPLAY_NUM="${DISPLAY_NUM:-1}"

echo "[Resize] Changing resolution to ${WIDTH}x${HEIGHT}"

# Check if xrandr is available
if ! command -v xrandr &> /dev/null; then
    echo "[Resize] Error: xrandr not found"
    exit 1
fi

# Export display
export DISPLAY=:${DISPLAY_NUM}

# Get current mode name
MODE_NAME="${WIDTH}x${HEIGHT}"

# Check if mode exists, if not create it
if ! xrandr | grep -q "${MODE_NAME}"; then
    echo "[Resize] Creating new mode: ${MODE_NAME}"
    
    # Generate modeline using cvt
    MODELINE=$(cvt ${WIDTH} ${HEIGHT} 60 | grep Modeline | cut -d' ' -f3-)
    
    # Add new mode
    xrandr --newmode ${MODE_NAME} ${MODELINE} 2>/dev/null || true
    xrandr --addmode VNC-0 ${MODE_NAME} 2>/dev/null || \
    xrandr --addmode default ${MODE_NAME} 2>/dev/null || \
    xrandr --addmode screen ${MODE_NAME} 2>/dev/null || true
fi

# Apply the resolution
xrandr --output VNC-0 --mode ${MODE_NAME} 2>/dev/null || \
xrandr --output default --mode ${MODE_NAME} 2>/dev/null || \
xrandr --output screen --mode ${MODE_NAME} 2>/dev/null || \
xrandr -s ${MODE_NAME} 2>/dev/null || {
    echo "[Resize] Warning: Could not change resolution"
    exit 1
}

echo "[Resize] Resolution changed to ${WIDTH}x${HEIGHT}"
