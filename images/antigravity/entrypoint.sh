#!/bin/bash
set -e

# Setup subuid/subgid if running as non-root to support buildah rootless
if [ "$(id -u)" -ne 0 ]; then
    # Ensure current user is in /etc/subuid and /etc/subgid
    USER_NAME=$(id -un)
    if ! grep -q "^${USER_NAME}:" /etc/subuid; then
        echo "Warning: ${USER_NAME} not found in /etc/subuid. Rootless buildah might fail."
    fi
fi

# Ensure storage directories exist
mkdir -p "$HOME/.local/share/containers/storage"
mkdir -p "$HOME/workspace"

# Start Antigravity Server in the background
# Replace this with the actual launch command for the Antigravity IDE/Server
if [ -n "$ANTIGRAVITY_SERVER_PASSWORD" ]; then
    export PASSWORD="$ANTIGRAVITY_SERVER_PASSWORD"
    # Placeholder: assuming the binary takes standard flags
    antigravity --bind-addr 0.0.0.0:8080 --auth password &
else
    # Placeholder: assuming the binary takes standard flags
    antigravity --bind-addr 0.0.0.0:8080 --auth none &
fi

# Execute main command
exec "$@"
