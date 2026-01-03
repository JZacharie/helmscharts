#!/bin/bash
set -e

# Install mods if INSTALL_MODS env var is set
if [ -n "$INSTALL_MODS" ]; then
    echo "Installing mods: $INSTALL_MODS"
    for mod in $INSTALL_MODS; do
        echo "Installing $mod..."
        powerpipe mod install "$mod" || echo "Failed to install $mod, continuing..."
    done
fi

# Execute the passed command (CMD)
exec "$@"
