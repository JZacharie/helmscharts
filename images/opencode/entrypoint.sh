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

# Execute OpenCode or provided command
exec "$@"
