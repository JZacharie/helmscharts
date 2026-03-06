#!/bin/bash
# =============================================================================
# Antigravity Docker - Idle Monitor Script
# =============================================================================
# Monitors VNC connections and reduces resource usage when idle
# =============================================================================

set -e

# Configuration
CHECK_INTERVAL="${IDLE_CHECK_INTERVAL:-30}"      # Seconds between checks
IDLE_TIMEOUT="${IDLE_TIMEOUT:-60}"               # Seconds before entering idle mode
VNC_PORT="${VNC_PORT:-5901}"
DISPLAY_NUM="${DISPLAY_NUM:-1}"

# State tracking
LAST_CONNECTED_TIME=$(date +%s)
IS_IDLE=false

log() {
    echo "[Idle Monitor] $(date '+%H:%M:%S') - $1"
}

# -----------------------------------------------------------------------------
# Check if any VNC client is connected
# -----------------------------------------------------------------------------
is_client_connected() {
    # Check for established connections to VNC port
    local connections=$(ss -tn state established "( sport = :${VNC_PORT} )" 2>/dev/null | grep -c ESTAB 2>/dev/null || echo "0")
    
    # Also check noVNC websocket connections
    local ws_connections=$(ss -tn state established "( sport = :${NOVNC_PORT:-6080} )" 2>/dev/null | grep -c ESTAB 2>/dev/null || echo "0")
    
    [ "$connections" -gt 0 ] || [ "$ws_connections" -gt 0 ]
}

# -----------------------------------------------------------------------------
# Enter idle mode - reduce resource usage
# -----------------------------------------------------------------------------
enter_idle_mode() {
    if [ "$IS_IDLE" = true ]; then
        return
    fi
    
    log "Entering idle mode - reducing resource usage"
    IS_IDLE=true
    
    export DISPLAY=:${DISPLAY_NUM}
    
    # 1. Blank the screen (DPMS off)
    xset dpms force off 2>/dev/null || true
    
    # 2. Disable XFCE compositor to save GPU
    xfconf-query -c xfwm4 -p /general/use_compositing -s false 2>/dev/null || true
    
    # 3. Reduce VNC encoding quality (if supported)
    # TigerVNC doesn't have runtime quality adjustment, but we can set env for next connection
    
    # 4. Lower process priority for desktop processes
    renice 10 -p $(pgrep -f xfce4-session) 2>/dev/null || true
    renice 10 -p $(pgrep -f xfwm4) 2>/dev/null || true
    
    # 5. Optional: Send SIGSTOP to Antigravity if configured
    if [ "${IDLE_PAUSE_ANTIGRAVITY}" = "true" ]; then
        pkill -STOP -f "antigravity" 2>/dev/null || true
        log "Paused Antigravity process"
    fi
    
    log "Idle mode active"
}

# -----------------------------------------------------------------------------
# Exit idle mode - restore normal operation
# -----------------------------------------------------------------------------
exit_idle_mode() {
    if [ "$IS_IDLE" = false ]; then
        return
    fi
    
    log "Client connected - exiting idle mode"
    IS_IDLE=false
    
    export DISPLAY=:${DISPLAY_NUM}
    
    # 1. Unblank the screen
    xset dpms force on 2>/dev/null || true
    xset s reset 2>/dev/null || true
    
    # 2. Re-enable XFCE compositor
    xfconf-query -c xfwm4 -p /general/use_compositing -s true 2>/dev/null || true
    
    # 3. Restore process priority
    renice 0 -p $(pgrep -f xfce4-session) 2>/dev/null || true
    renice 0 -p $(pgrep -f xfwm4) 2>/dev/null || true
    
    # 4. Resume Antigravity if it was paused
    if [ "${IDLE_PAUSE_ANTIGRAVITY}" = "true" ]; then
        pkill -CONT -f "antigravity" 2>/dev/null || true
        log "Resumed Antigravity process"
    fi
    
    log "Normal mode restored"
}

# -----------------------------------------------------------------------------
# Main monitoring loop
# -----------------------------------------------------------------------------
log "Starting idle monitor (check every ${CHECK_INTERVAL}s, idle after ${IDLE_TIMEOUT}s)"

while true; do
    sleep ${CHECK_INTERVAL}
    
    if is_client_connected; then
        LAST_CONNECTED_TIME=$(date +%s)
        exit_idle_mode
    else
        CURRENT_TIME=$(date +%s)
        IDLE_DURATION=$((CURRENT_TIME - LAST_CONNECTED_TIME))
        
        if [ $IDLE_DURATION -ge $IDLE_TIMEOUT ]; then
            enter_idle_mode
        fi
    fi
done
