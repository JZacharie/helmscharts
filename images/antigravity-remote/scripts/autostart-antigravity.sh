#!/bin/bash
# =============================================================================
# Antigravity Docker - Auto-start Antigravity in fullscreen
# =============================================================================
# This script runs at desktop startup and launches Antigravity maximized
# =============================================================================

# Wait for desktop to be fully initialized
sleep 3

# Launch Antigravity maximized using wmctrl or xdotool
# First, start Antigravity
antigravity &

# Wait for window to appear
sleep 2

# Try to maximize the window
# Method 1: Using wmctrl (if available)
if command -v wmctrl &> /dev/null; then
    wmctrl -r "Antigravity" -b add,maximized_vert,maximized_horz 2>/dev/null || true
fi

# Method 2: Using xdotool (if available) 
if command -v xdotool &> /dev/null; then
    # Find Antigravity window and maximize it
    WINDOW_ID=$(xdotool search --name "Antigravity" 2>/dev/null | head -1)
    if [ -n "$WINDOW_ID" ]; then
        xdotool windowactivate --sync "$WINDOW_ID" 2>/dev/null || true
        xdotool key --window "$WINDOW_ID" "super+Up" 2>/dev/null || true
    fi
fi

echo "[Autostart] Antigravity launched"
