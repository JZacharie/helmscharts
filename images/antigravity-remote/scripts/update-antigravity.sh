#!/bin/bash
# =============================================================================
# Antigravity Docker - Auto-Update Script
# =============================================================================
# Checks for and installs Antigravity updates
# This script is run at container startup and via cron
# =============================================================================

set -e

LOG_FILE="/tmp/antigravity-update.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[${TIMESTAMP}] $1" | tee -a "${LOG_FILE}"
}

log "============================================"
log "Checking for Antigravity updates..."
log "============================================"

# Update package lists
log "Updating package lists..."
sudo apt-get update -qq 2>&1 | tee -a "${LOG_FILE}" || {
    log "Warning: Failed to update package lists"
    exit 0
}

# Check if update is available
CURRENT_VERSION=$(dpkg-query -W -f='${Version}' antigravity 2>/dev/null || echo "not-installed")
log "Current version: ${CURRENT_VERSION}"

# Simulate upgrade to check for new version
UPGRADE_OUTPUT=$(apt-cache policy antigravity 2>/dev/null || echo "")
CANDIDATE_VERSION=$(echo "${UPGRADE_OUTPUT}" | grep "Candidate:" | awk '{print $2}')
log "Available version: ${CANDIDATE_VERSION:-unknown}"

if [ "${CURRENT_VERSION}" != "${CANDIDATE_VERSION}" ] && [ -n "${CANDIDATE_VERSION}" ]; then
    log "New version available! Upgrading..."
    
    # Perform the upgrade
    sudo apt-get install -y --only-upgrade antigravity 2>&1 | tee -a "${LOG_FILE}" && {
        NEW_VERSION=$(dpkg-query -W -f='${Version}' antigravity 2>/dev/null || echo "unknown")
        log "Successfully upgraded to version: ${NEW_VERSION}"
        
        # Notify user (if desktop is running)
        if command -v notify-send &> /dev/null && [ -n "$DISPLAY" ]; then
            notify-send "Antigravity Updated" "Updated to version ${NEW_VERSION}" --icon=system-software-update
        fi
    } || {
        log "Warning: Upgrade failed"
    }
else
    log "Antigravity is up to date."
fi

log "Update check complete."
log "============================================"
