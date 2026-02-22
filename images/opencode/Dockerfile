# State-of-the-art OpenCode 2026 Environment
# Includes Go, Rust, Python (uv), Node (Bun), Buildah, and productivity tools
FROM ubuntu:24.04

# --- Build Arguments for Cache Invalidation & Versioning ---
ARG GO_VERSION=1.23.0
ARG OPENCODE_VERSION=v1.2.10
ARG EZA_VERSION=v0.20.18
ARG BAT_VERSION=v0.24.0
ARG FZF_VERSION=0.55.0

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive
# Setup locale & common ENVs
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# --- 1. System Dependencies (Heavy Layer) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    unzip \
    xz-utils \
    jq \
    pkg-config \
    libssl-dev \
    zsh \
    bash \
    procps \
    locales \
    uidmap \
    buildah \
    fuse-overlayfs \
    openssh-client \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

# --- 2. Buildah Storage Config (Rootless) ---
RUN mkdir -p /etc/containers && \
    echo '[storage]\ndriver = "overlay"\nrunroot = "/run/user/1000"\ngraphroot = "/home/developer/.local/share/containers/storage"\n[storage.options.overlay]\nmount_program = "/usr/bin/fuse-overlayfs"' > /etc/containers/storage.conf

# --- 3. User & Permissions ---
# Remove default ubuntu user if present, then create developer
RUN if id -u 1000 >/dev/null 2>&1; then userdel -r $(id -un 1000); fi && \
    if getent group 1000 >/dev/null 2>&1; then groupdel $(getent group 1000 | cut -d: -f1); fi && \
    groupadd -g 1000 developer && \
    useradd -m -u 1000 -g developer -s /bin/bash developer && \
    echo "developer:10000:65536" > /etc/subuid && \
    echo "developer:10000:65536" > /etc/subgid

# --- 4. System-Wide CLI Installations (Root) ---
# OpenCode CLI (glibc)
RUN curl -fsSL -o /tmp/opencode.tar.gz "https://github.com/anomalyco/opencode/releases/download/${OPENCODE_VERSION}/opencode-linux-x64.tar.gz" && \
    tar -xzf /tmp/opencode.tar.gz -C /usr/local/bin/ && \
    rm /tmp/opencode.tar.gz

# --- 5. Switch to Developer User for Toolchains ---
USER developer
WORKDIR /home/developer
ENV HOME=/home/developer \
    PATH="/home/developer/.local/bin:/home/developer/bin:${PATH}"

# --- 6. Toolchains (Parallelifiable conceptually, but distinct layers) ---

# Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && \
    . "$HOME/.cargo/env" && \
    cargo install bacon && \
    cargo install cargo-nextest --locked
ENV PATH="/home/developer/.cargo/bin:${PATH}"

# Go
ENV GOROOT="/home/developer/go" \
    GOPATH="/home/developer/go-workspace"
ENV PATH="${GOROOT}/bin:${GOPATH}/bin:${PATH}"
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" | tar -xz -C /tmp && \
    mkdir -p "$HOME/bin" && mv /tmp/go "$HOME/go" && \
    ln -s "$HOME/go/bin/go" "$HOME/bin/go" && \
    ln -s "$HOME/go/bin/gofmt" "$HOME/bin/gofmt" && \
    go install github.com/air-verse/air@latest && \
    go install github.com/go-delve/delve/cmd/dlv@latest && \
    rm -rf /tmp/go

# Python (uv) & Node (Bun)
ENV PATH="/home/developer/.bun/bin:${PATH}"
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    ~/.local/bin/uv tool install ruff && \
    curl -fsSL https://bun.sh/install | bash && \
    curl -fsSL https://get.pnpm.io/install.sh | sh - && \
    ~/.bun/bin/bun add -g @biomejs/biome

# VS Code (code-server)
RUN curl -fsSL https://code-server.dev/install.sh | sh && \
    mkdir -p ~/.local/share/code-server ~/.config/code-server

# --- 7. Productivity CLI (Precompiled binaries when possible) ---
RUN mkdir -p /home/developer/bin && \
    curl -sS https://starship.rs/install.sh | sh -s -- -y -b /home/developer/bin && \
    curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh && \
    curl -fsSL "https://github.com/eza-community/eza/releases/download/${EZA_VERSION}/eza_x86_64-unknown-linux-gnu.tar.gz" | tar -xz -C /home/developer/bin && \
    mv /home/developer/bin/eza /home/developer/bin/ls-eza && \
    curl -fsSL "https://github.com/sharkdp/bat/releases/download/${BAT_VERSION}/bat-${BAT_VERSION}-x86_64-unknown-linux-gnu.tar.gz" | tar -xz --strip-components=1 -C /home/developer/bin && \
    curl -fsSL "https://github.com/junegunn/fzf/releases/download/v${FZF_VERSION}/fzf-${FZF_VERSION}-linux_amd64.tar.gz" | tar -xz -C /home/developer/bin

# Shell setup
RUN echo 'eval "$(/home/developer/bin/starship init bash)"' >> ~/.bashrc && \
    echo 'eval "$(/home/developer/.local/bin/zoxide init bash)"' >> ~/.bashrc && \
    echo 'alias ls="ls-eza"' >> ~/.bashrc && \
    echo 'alias cat="bat"' >> ~/.bashrc

# --- 8. Final Config ---
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
USER root
RUN chmod +x /usr/local/bin/entrypoint.sh
USER developer

EXPOSE 7681 8080
ENTRYPOINT ["entrypoint.sh"]
CMD ["opencode", "web", "--hostname", "0.0.0.0", "--port", "7681"]
