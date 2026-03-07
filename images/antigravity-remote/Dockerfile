# =============================================================================
# Antigravity Remote Docker
# A GPU-accelerated container for running Google Antigravity remotely via noVNC
# =============================================================================

FROM nvidia/cuda:12.3.1-runtime-ubuntu22.04

LABEL maintainer="raphl"
LABEL description="Google Antigravity with noVNC remote access and GPU support"

# =============================================================================
# Environment Configuration
# =============================================================================
ENV DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    # Display settings
    DISPLAY=:1 \
    DISPLAY_WIDTH=1920 \
    DISPLAY_HEIGHT=1080 \
    DISPLAY_DEPTH=24 \
    # VNC settings
    VNC_PORT=5901 \
    NOVNC_PORT=6080 \
    VNC_PASSWORD=antigravity \
    # User settings
    USER=antigravity \
    UID=1000 \
    GID=1000 \
    HOME=/home/antigravity \
    # Antigravity settings
    ANTIGRAVITY_AUTO_UPDATE=true

# =============================================================================
# System Dependencies
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core utilities
    ca-certificates \
    curl \
    wget \
    gnupg \
    sudo \
    locales \
    tzdata \
    dbus-x11 \
    # X11 and desktop
    xvfb \
    x11vnc \
    tigervnc-standalone-server \
    tigervnc-common \
    tigervnc-tools \
    xfce4 \
    xfce4-goodies \
    xfce4-terminal \
    # Fonts and theming
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    fonts-roboto \
    fonts-font-awesome \
    gtk2-engines-pixbuf \
    adwaita-icon-theme \
    elementary-xfce-icon-theme \
    gnome-icon-theme \
    hicolor-icon-theme \
    papirus-icon-theme \
    # noVNC dependencies
    python3 \
    python3-pip \
    python3-numpy \
    # Audio (optional, for future use)
    pulseaudio \
    # Clipboard support
    xclip \
    xsel \
    # Process management
    supervisor \
    # Auto-updates
    unattended-upgrades \
    apt-transport-https \
    # Utilities
    nano \
    btop \
    vim \
    git \
    htop \
    procps \
    net-tools \
    # Window management (for auto-maximize)
    wmctrl \
    xdotool \
    # PDF Reader
    atril \
    # Build and tool dependencies
    unzip \
    xz-utils \
    pkg-config \
    libssl-dev \
    lsb-release \
    software-properties-common \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Install Google Chrome
# =============================================================================
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Locale Configuration
# =============================================================================
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# =============================================================================
# Install noVNC and websockify
# =============================================================================
RUN mkdir -p /opt/novnc \
    && curl -fsSL https://github.com/novnc/noVNC/archive/refs/tags/v1.4.0.tar.gz | tar -xz -C /opt/novnc --strip-components=1 \
    && mkdir -p /opt/websockify \
    && curl -fsSL https://github.com/novnc/websockify/archive/refs/tags/v0.11.0.tar.gz | tar -xz -C /opt/websockify --strip-components=1 \
    && ln -sf /opt/websockify /opt/novnc/utils/websockify

# Create custom index.html that forces English language and auto-connects
RUN echo '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=vnc.html?autoconnect=true&resize=remote&lang=en"></head><body>Redirecting...</body></html>' > /opt/novnc/index.html

# =============================================================================
# Add Antigravity Repository and Install
# =============================================================================
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | \
    gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" | \
    tee /etc/apt/sources.list.d/antigravity.list > /dev/null \
    && apt-get update \
    && apt-get install -y antigravity \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Create Non-Root User
# =============================================================================
RUN groupadd -g ${GID} ${USER} \
    && useradd -m -u ${UID} -g ${GID} -s /bin/bash ${USER} \
    && usermod -aG docker ${USER} \
    && echo "${USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/${USER} \
    && chmod 0440 /etc/sudoers.d/${USER}

# =============================================================================
# Install Cloud Tools (kubectl, Helm, Terraform)
# =============================================================================
RUN export KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt | tr -d '\n' | tr -d '\r') \
    && curl -L "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" -o /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl \
    && curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install -y terraform docker.io \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Install AWS CLI v2
# =============================================================================
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

# =============================================================================
# Install FreeLens
# =============================================================================
RUN curl -L "https://github.com/freelensapp/freelens/releases/download/v1.8.1/Freelens-1.8.1-linux-amd64.deb" -o /tmp/freelens.deb \
    && apt-get update \
    && apt-get install -y /tmp/freelens.deb \
    && rm /tmp/freelens.deb \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Configure VNC and Desktop
# =============================================================================
RUN mkdir -p /home/${USER}/.vnc /home/${USER}/.config \
    && chown -R ${USER}:${USER} /home/${USER}

# =============================================================================
# Install Development Toolchains (Rust, Go, Python-uv)
# =============================================================================
USER ${USER}
WORKDIR /home/${USER}
ENV PATH="/home/${USER}/.local/bin:/home/${USER}/bin:/home/${USER}/.cargo/bin:/usr/local/go/bin:${PATH}" \
    GOROOT="/usr/local/go" \
    GOPATH="/home/${USER}/go-workspace"

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable \
    && curl -LsSf https://astral.sh/uv/install.sh | sh \
    && GO_VERSION=1.23.0 \
    && curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" | sudo tar -xz -C /usr/local \
    && curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh \
    && /home/${USER}/.local/bin/rtk init -g --auto-patch

# Add RTK aliases to bashrc
RUN echo 'alias git="rtk git"' >> /home/${USER}/.bashrc \
    && echo 'alias kubectl="rtk kubectl"' >> /home/${USER}/.bashrc \
    && echo 'alias helm="rtk helm"' >> /home/${USER}/.bashrc \
    && echo 'alias terraform="rtk terraform"' >> /home/${USER}/.bashrc \
    && echo 'alias rustc="rtk rustc"' >> /home/${USER}/.bashrc \
    && echo 'alias cargo="rtk cargo"' >> /home/${USER}/.bashrc \
    && echo 'alias go="rtk go"' >> /home/${USER}/.bashrc \
    && echo 'alias python="rtk python"' >> /home/${USER}/.bashrc \
    && echo 'alias python3="rtk python3"' >> /home/${USER}/.bashrc \
    && echo 'alias pip="rtk pip"' >> /home/${USER}/.bashrc \
    && echo 'alias uv="rtk uv"' >> /home/${USER}/.bashrc \
    && echo 'alias ls="rtk ls"' >> /home/${USER}/.bashrc \
    && echo 'alias grep="rtk grep"' >> /home/${USER}/.bashrc \
    && echo 'alias rg="rtk rg"' >> /home/${USER}/.bashrc \
    && echo 'alias cat="rtk cat"' >> /home/${USER}/.bashrc

USER root

# =============================================================================
# Copy Configuration Files
# =============================================================================
COPY --chown=${USER}:${USER} config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY --chown=${USER}:${USER} scripts/ /opt/scripts/
RUN chmod +x /opt/scripts/*.sh

# =============================================================================
# Configure Auto-Updates for Antigravity
# =============================================================================
RUN echo 'APT::Periodic::Update-Package-Lists "1";' > /etc/apt/apt.conf.d/20auto-upgrades \
    && echo 'APT::Periodic::Unattended-Upgrade "1";' >> /etc/apt/apt.conf.d/20auto-upgrades \
    && echo 'Unattended-Upgrade::Allowed-Origins { "antigravity-auto-updater-dev:antigravity-debian"; };' > /etc/apt/apt.conf.d/50unattended-upgrades

# =============================================================================
# Exposed Ports
# =============================================================================
# VNC: 5901, noVNC: 6080
EXPOSE ${VNC_PORT} ${NOVNC_PORT}

# =============================================================================
# Copy Configuration Defaults
# =============================================================================
RUN mkdir -p /opt/defaults
COPY config/xfce4-panel.xml /opt/defaults/xfce4-panel.xml

# =============================================================================
# Volumes
# =============================================================================
VOLUME ["/home/${USER}/workspace", "/home/${USER}/.config"]

# =============================================================================
# Health Check
# =============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${NOVNC_PORT}/ || exit 1

# =============================================================================
# Entrypoint
# =============================================================================
USER ${USER}
WORKDIR /home/${USER}

ENTRYPOINT ["/opt/scripts/entrypoint.sh"]
CMD ["supervisord"]
