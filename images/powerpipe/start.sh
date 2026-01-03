#!/bin/bash

# Debug info
echo "Current user: $(id)"
echo "Current dir: $(pwd)"
echo "Environment INSTALL_MODS: $INSTALL_MODS"

# Ensure we are in the home directory
cd /home/powerpipe
echo "Changed to /home/powerpipe"

# Initialize mod if needed (check if mod.pp exists)
if [ ! -f "mod.pp" ]; then
    echo "Initializing mod..."
    powerpipe mod init || echo "Mod init failed/skipped"
fi

# Install mods if INSTALL_MODS env var is set
if [ -n "$INSTALL_MODS" ]; then
    echo "Installing mods: $INSTALL_MODS"
    for mod in $INSTALL_MODS; do
        echo "Installing $mod..."
        powerpipe mod install "$mod" || echo "Failed to install $mod, continuing..."
    done
fi

echo "Starting Powerpipe server..."
echo "Command: $@"
exec "$@"
