#!/bin/bash
# =============================================================================
# Antigravity Docker - Entrypoint Script
# =============================================================================
# This script initializes the container environment and starts all services
# =============================================================================

set -e

echo "==========================================="
echo "  Antigravity Remote Docker"
echo "  Starting container initialization..."
echo "==========================================="

# Initialize /home/antigravity if it is a mounted PVC and empty/uninitialized
if [ ! -f /home/antigravity/.bashrc ]; then
    echo "PVC initialization: Copying initial home files to /home/antigravity..."
    cp -a /opt/antigravity-home-backup/. /home/antigravity/
    chown -R ${USER}:${USER} /home/antigravity
fi

# =============================================================================
# Set VNC Password
# =============================================================================
echo "Setting VNC password..."
mkdir -p /home/${USER}/.vnc
echo "${VNC_PASSWORD:-antigravity}" | vncpasswd -f > /home/${USER}/.vnc/passwd
chmod 600 /home/${USER}/.vnc/passwd

# =============================================================================
# Create VNC xstartup
# =============================================================================
echo "Configuring VNC xstartup..."
cat > /home/${USER}/.vnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

# Start D-Bus
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    eval $(dbus-launch --sh-syntax)
    export DBUS_SESSION_BUS_ADDRESS
fi

# Set up XDG directories
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_CACHE_HOME="$HOME/.cache"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_RUNTIME_DIR="/tmp/runtime-$USER"
mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"

# Start XFCE4 desktop
# Antigravity is auto-launched by supervisor after desktop is ready
exec startxfce4
EOF
chmod +x /home/${USER}/.vnc/xstartup


# =============================================================================
# Initialize Configuration
# =============================================================================
echo "Initializing configuration..."
mkdir -p /home/${USER}/.config/xfce4/xfconf/xfce-perchannel-xml

# Ensure machine-id exists (required for D-Bus)
dbus-uuidgen --ensure

# Start a temporary D-Bus session for configuration (required for xfconf-query)
# We force a new one and unset DISPLAY to avoid any X11 or inherited environment conflicts
echo "Starting temporary D-Bus session..."
OLD_DISPLAY=$DISPLAY
unset DISPLAY
unset DBUS_SESSION_BUS_ADDRESS
eval $(dbus-launch --sh-syntax)
export DBUS_SESSION_BUS_ADDRESS
export DBUS_SESSION_BUS_PID

# Apply default panel configuration if not present
if [ ! -f /home/${USER}/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml ]; then
    echo "Applying custom panel configuration..."
    if [ -f /opt/defaults/xfce4-panel.xml ]; then
        cp /opt/defaults/xfce4-panel.xml /home/${USER}/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml
    else
        echo "Warning: Default panel config not found at /opt/defaults/xfce4-panel.xml"
    fi
fi

# Set default icon theme if not set
if ! xfconf-query -c xsettings -p /Net/IconThemeName >/dev/null 2>&1; then
    echo "Setting default icon theme to Papirus-Dark..."
    xfconf-query -c xsettings -p /Net/IconThemeName -s "Papirus-Dark" --create -t string || true
fi

# Kill temporary D-Bus session to avoid conflicts with the desktop session later
if [ -n "$DBUS_SESSION_BUS_PID" ]; then
    kill "$DBUS_SESSION_BUS_PID" >/dev/null 2>&1 || true
    unset DBUS_SESSION_BUS_ADDRESS
    unset DBUS_SESSION_BUS_PID
fi
DISPLAY=$OLD_DISPLAY

# =============================================================================
# Create directories
# =============================================================================
echo "Creating workspace and config directories..."
# Important: ensure .local and .antigravity are explicitly created and persisted
mkdir -p /home/${USER}/workspace \
         /home/${USER}/.config \
         /home/${USER}/.local \
         /home/${USER}/.antigravity \
         /home/${USER}/.ssh \
         /home/${USER}/Desktop \
         /home/${USER}/bin \
         /home/${USER}/go-workspace

# Create FreeLens Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Freelens.desktop ]; then
    echo "Creating FreeLens desktop shortcut..."
    cat > /home/${USER}/Desktop/Freelens.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Freelens
Comment=Kubernetes IDE
Exec=Freelens --no-sandbox
Icon=Freelens
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Freelens.desktop
fi
cp -f /home/${USER}/Desktop/Freelens.desktop /usr/share/applications/Freelens.desktop

# Create OpenCode Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Opencode.desktop ]; then
    echo "Creating OpenCode desktop shortcut..."
    cat > /home/${USER}/Desktop/Opencode.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=OpenCode
Comment=OpenCode AI Coding Agent
Exec=xfce4-terminal -e "opencode"
Icon=utilities-terminal
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Opencode.desktop
fi
cp -f /home/${USER}/Desktop/Opencode.desktop /usr/share/applications/Opencode.desktop

# Create Antigravity Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Antigravity.desktop ]; then
    echo "Creating Antigravity desktop shortcut..."
    cat > /home/${USER}/Desktop/Antigravity.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Antigravity
Comment=Google Antigravity Agent
Exec=antigravity
Icon=system-run
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Antigravity.desktop
fi
cp -f /home/${USER}/Desktop/Antigravity.desktop /usr/share/applications/antigravity.desktop

# Create Antigravity IDE Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/AntigravityIDE.desktop ]; then
    echo "Creating Antigravity IDE desktop shortcut..."
    cat > /home/${USER}/Desktop/AntigravityIDE.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Antigravity IDE
Comment=Antigravity Intelligent Development Environment
Exec=antigravity ide
Icon=system-run
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/AntigravityIDE.desktop
fi
cp -f /home/${USER}/Desktop/AntigravityIDE.desktop /usr/share/applications/antigravity-ide.desktop

# Create Helm Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Helm.desktop ]; then
    echo "Creating Helm desktop shortcut..."
    cat > /home/${USER}/Desktop/Helm.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Helm
Comment=Kubernetes Package Manager
Exec=xfce4-terminal -hold -e "helm"
Icon=utilities-terminal
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Helm.desktop
fi

# Create Kubectl Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Kubectl.desktop ]; then
    echo "Creating Kubectl desktop shortcut..."
    cat > /home/${USER}/Desktop/Kubectl.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Kubectl
Comment=Kubernetes Command Line Tool
Exec=xfce4-terminal -hold -e "kubectl"
Icon=utilities-terminal
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Kubectl.desktop
fi

# Create Terraform Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Terraform.desktop ]; then
    echo "Creating Terraform desktop shortcut..."
    cat > /home/${USER}/Desktop/Terraform.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Terraform
Comment=Infrastructure as Code
Exec=xfce4-terminal -hold -e "terraform"
Icon=utilities-terminal
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Terraform.desktop
fi

# Create Rust Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Rust.desktop ]; then
    echo "Creating Rust desktop shortcut..."
    cat > /home/${USER}/Desktop/Rust.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Rust
Comment=Rust Toolchain
Exec=xfce4-terminal -hold -e "cargo --version"
Icon=utilities-terminal
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Rust.desktop
fi

# Create Python Desktop Shortcut
if [ ! -f /home/${USER}/Desktop/Python.desktop ]; then
    echo "Creating Python desktop shortcut..."
    cat > /home/${USER}/Desktop/Python.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Python
Comment=Python Interpreter
Exec=xfce4-terminal -hold -e "python3"
Icon=utilities-terminal
Path=
Terminal=false
StartupNotify=false
EOF
    chmod +x /home/${USER}/Desktop/Python.desktop
fi

# =============================================================================
# Fix permissions
# =============================================================================
echo "Fixing permissions..."
# Ensure all persistence-critical directories are owned by the user
chown -R ${USER}:${USER} \
    /home/${USER}/.vnc \
    /home/${USER}/.config \
    /home/${USER}/.local \
    /home/${USER}/.antigravity \
    /home/${USER}/.ssh \
    /home/${USER}/Desktop \
    /home/${USER}/workspace \
    2>/dev/null || true

chown ${USER}:${USER} /home/${USER} 2>/dev/null || true

# =============================================================================
# Clean up Google Chrome locks
# =============================================================================
echo "Cleaning up Google Chrome lock files..."
rm -f /home/${USER}/.config/google-chrome/Singleton* 2>/dev/null || true


# =============================================================================
# Check for Antigravity updates (if enabled)
# =============================================================================
if [ "${ANTIGRAVITY_AUTO_UPDATE}" = "true" ]; then
    echo "Checking for Antigravity updates..."
    /opt/scripts/update-antigravity.sh || true
fi

# =============================================================================
# Display GPU information
# =============================================================================
echo ""
echo "==========================================="
echo "  GPU Information"
echo "==========================================="
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>/dev/null || echo "No NVIDIA GPU detected"
echo ""

# =============================================================================
# Display connection information
# =============================================================================
echo "==========================================="
echo "  Connection Information"
echo "==========================================="
echo "  noVNC Web Access: http://localhost:${NOVNC_PORT:-6080}"
echo "  VNC Direct:       localhost:${VNC_PORT:-5901}"
echo "  Password:         (as configured)"
echo ""
echo "  Resolution will auto-adjust to browser"
echo "  Default: ${DISPLAY_WIDTH:-1920}x${DISPLAY_HEIGHT:-1080}"
echo "==========================================="
echo ""

# =============================================================================
# Execute the main command
# =============================================================================
if [ "$1" = "supervisord" ]; then
    echo "Starting Supervisor..."
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
else
    exec "$@"
fi
