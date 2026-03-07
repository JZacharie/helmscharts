# =============================================================================
# Antigravity Remote Docker - Optimized
# A GPU-accelerated container for running Google Antigravity remotely via noVNC
# =============================================================================

# --- Stage 1: Downloader ---
FROM alpine:latest AS downloader

# Tool Versions
ARG NOVNC_VERSION=1.6.0
ARG WEBSOCKIFY_VERSION=0.13.0
ARG GO_VERSION=1.26.1
ARG FREELENS_VERSION=1.8.1

RUN apk add --no-cache curl tar unzip

WORKDIR /tmp

# Download noVNC
RUN mkdir -p /opt/novnc \
    && curl -fsSL https://github.com/novnc/noVNC/archive/refs/tags/v${NOVNC_VERSION}.tar.gz | tar -xz -C /opt/novnc --strip-components=1 \
    && echo '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=vnc.html?autoconnect=true&resize=remote&lang=en"></head><body>Redirecting...</body></html>' > /opt/novnc/index.html

# Download websockify
RUN mkdir -p /opt/websockify \
    && curl -fsSL https://github.com/novnc/websockify/archive/refs/tags/v${WEBSOCKIFY_VERSION}.tar.gz | tar -xz -C /opt/websockify --strip-components=1 \
    && ln -sf /opt/websockify /opt/novnc/utils/websockify

# Download Go
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -o go.tar.gz

# Download AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip

# Download FreeLens
RUN curl -L "https://github.com/freelensapp/freelens/releases/download/v${FREELENS_VERSION}/Freelens-${FREELENS_VERSION}-linux-amd64.deb" -o freelens.deb

# --- Stage 2: Final Image ---
FROM nvidia/cuda:12.6.3-runtime-ubuntu24.04

LABEL maintainer="raphl"
LABEL description="Google Antigravity with noVNC remote access and GPU support"

# Environment Configuration
ENV DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    DISPLAY=:1 \
    DISPLAY_WIDTH=1920 \
    DISPLAY_HEIGHT=1080 \
    DISPLAY_DEPTH=24 \
    VNC_PORT=5901 \
    NOVNC_PORT=6080 \
    VNC_PASSWORD=antigravity \
    USER=antigravity \
    UID=1000 \
    GID=1000 \
    HOME=/home/antigravity \
    ANTIGRAVITY_AUTO_UPDATE=true \
    PATH="/home/antigravity/.local/bin:/home/antigravity/bin:/home/antigravity/.cargo/bin:/usr/local/go/bin:${PATH}" \
    GOROOT="/usr/local/go" \
    GOPATH="/home/antigravity/go-workspace" \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# Consolidated System Dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl wget gnupg sudo locales tzdata dbus-x11 \
    xvfb x11vnc tigervnc-standalone-server tigervnc-common tigervnc-tools \
    xfce4 xfce4-goodies xfce4-terminal \
    fonts-dejavu fonts-liberation fonts-noto fonts-roboto fonts-font-awesome \
    gtk2-engines-pixbuf adwaita-icon-theme elementary-xfce-icon-theme \
    gnome-icon-theme hicolor-icon-theme papirus-icon-theme \
    python3 python3-pip python3-numpy pulseaudio \
    xclip xsel supervisor unattended-upgrades apt-transport-https \
    nano btop vim git htop procps net-tools wmctrl xdotool atril \
    unzip xz-utils pkg-config libssl-dev lsb-release \
    software-properties-common build-essential \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install Antigravity Repository and Package
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" | tee /etc/apt/sources.list.d/antigravity.list > /dev/null \
    && apt-get update \
    && apt-get install -y antigravity \
    && rm -rf /var/lib/apt/lists/*

# Install Hashicorp Tools and Docker CLI
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install -y terraform docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl
RUN KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt) \
    && curl -L "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" -o /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl

# Copy tools from downloader stage
COPY --from=downloader /opt/novnc /opt/novnc
COPY --from=downloader /opt/websockify /opt/websockify
COPY --from=downloader /tmp/go.tar.gz /tmp/go.tar.gz
COPY --from=downloader /tmp/aws /tmp/aws_install
COPY --from=downloader /tmp/freelens.deb /tmp/freelens.deb

# Install Go, AWS CLI, and FreeLens
RUN tar -xz -C /usr/local -f /tmp/go.tar.gz \
    && /tmp/aws_install/install \
    && apt-get update && apt-get install -y /tmp/freelens.deb \
    && rm -rf /tmp/* /var/lib/apt/lists/*

# Create Non-Root User
RUN groupadd -g ${GID} ${USER} \
    && useradd -m -u ${UID} -g ${GID} -s /bin/bash ${USER} \
    && groupadd -f docker \
    && usermod -aG docker ${USER} \
    && echo "${USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/${USER} \
    && chmod 0440 /etc/sudoers.d/${USER}

# Switch to User for remained toolchain installs
USER ${USER}
WORKDIR /home/${USER}

# Install Rust, UV, and RTK
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable \
    && curl -LsSf https://astral.sh/uv/install.sh | sh \
    && curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh \
    && /home/${USER}/.local/bin/rtk init -g --auto-patch

# Add RTK aliases
RUN for tool in git kubectl helm terraform rustc cargo go python python3 pip uv ls grep rg cat; do \
    echo "alias $tool='rtk $tool'" >> /home/${USER}/.bashrc; \
    done

USER root

# Copy Configuration and Scripts
COPY --chown=${USER}:${USER} config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY --chown=${USER}:${USER} config/xfce4-panel.xml /opt/defaults/xfce4-panel.xml
COPY --chown=${USER}:${USER} scripts/ /opt/scripts/
RUN chmod +x /opt/scripts/*.sh \
    && mkdir -p /opt/defaults /home/${USER}/.vnc /home/${USER}/.config \
    && chown -R ${USER}:${USER} /home/${USER}

# Configure Auto-Updates
RUN echo 'APT::Periodic::Update-Package-Lists "1";' > /etc/apt/apt.conf.d/20auto-upgrades \
    && echo 'APT::Periodic::Unattended-Upgrade "1";' >> /etc/apt/apt.conf.d/20auto-upgrades \
    && echo 'Unattended-Upgrade::Allowed-Origins { "antigravity-auto-updater-dev:antigravity-debian"; };' > /etc/apt/apt.conf.d/50unattended-upgrades

EXPOSE ${VNC_PORT} ${NOVNC_PORT}
VOLUME ["/home/${USER}/workspace", "/home/${USER}/.config"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${NOVNC_PORT}/ || exit 1

USER ${USER}
WORKDIR /home/${USER}
ENTRYPOINT ["/opt/scripts/entrypoint.sh"]
CMD ["supervisord"]
