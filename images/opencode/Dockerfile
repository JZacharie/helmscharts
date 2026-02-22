# State-of-the-art OpenCode 2026 Environment
# Includes Go, Rust, Python (uv), Node (Bun), Buildah, and productivity tools
FROM ubuntu:24.04

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install core dependencies
RUN apt-get update && apt-get install -y \
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
    && rm -rf /var/lib/apt/lists/*

# Setup locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Create 'developer' user (UID/GID 1000)
RUN groupadd -g 1000 developer && \
    useradd -m -u 1000 -g developer -s /bin/bash developer && \
    echo "developer:10000:65536" > /etc/subuid && \
    echo "developer:10000:65536" > /etc/subgid

# Switch to developer user for tool installs
USER developer
WORKDIR /home/developer
ENV HOME=/home/developer
ENV PATH="/home/developer/.local/bin:/home/developer/bin:${PATH}"

# --- Language Toolchains ---

# 1. Rust (rustup, bacon, cargo-nextest)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && \
    . "$HOME/.cargo/env" && \
    cargo install bacon cargo-nextest
ENV PATH="/home/developer/.cargo/bin:${PATH}"

# 2. Go (dlv, air)
ENV GO_VERSION=1.23.0
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" | tar -xz -C /tmp && \
    mkdir -p "$HOME/bin" && mv /tmp/go "$HOME/go" && \
    ln -s "$HOME/go/bin/go" "$HOME/bin/go" && \
    ln -s "$HOME/go/bin/gofmt" "$HOME/bin/gofmt"
ENV GOROOT="/home/developer/go"
ENV GOPATH="/home/developer/go-workspace"
ENV PATH="${GOROOT}/bin:${GOPATH}/bin:${PATH}"
RUN go install github.com/air-verse/air@latest && \
    go install github.com/go-delve/delve/cmd/dlv@latest

# 3. Python (uv, ruff)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    uv tool install ruff

# 4. Node/JS (Bun, pnpm, biome)
RUN curl -fsSL https://bun.sh/install | bash && \
    curl -fsSL https://get.pnpm.io/install.sh | sh -
ENV PATH="/home/developer/.bun/bin:${PATH}"
RUN bun add -g @biomejs/biome

# --- Productivity CLI ---

# Starship, Zoxide, Eza, Bat, Fzf
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y && \
    curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash && \
    curl -fsSL https://github.com/eza-community/eza/releases/latest/download/eza_x86_64-unknown-linux-gnu.tar.gz | tar -xz -C /home/developer/bin && \
    mv /home/developer/bin/eza /home/developer/bin/ls-eza && \
    curl -fsSL https://github.com/sharkdp/bat/releases/latest/download/bat-v0.24.0-x86_64-unknown-linux-gnu.tar.gz | tar -xz --strip-components=1 -C /home/developer/bin && \
    git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf && ~/.fzf/install --all

# --- OpenCode CLI ---

USER root
RUN OPENCODE_VERSION=$(curl -s https://api.github.com/repos/anomalyco/opencode/releases/latest | jq -r .tag_name) && \
    curl -fsSL -o /tmp/opencode.tar.gz \
    "https://github.com/anomalyco/opencode/releases/download/${OPENCODE_VERSION}/opencode-linux-x64.tar.gz" && \
    tar -xzf /tmp/opencode.tar.gz -C /usr/local/bin/ && \
    rm /tmp/opencode.tar.gz
USER developer

# --- Configuration ---

# Shell setup
RUN echo 'eval "$(starship init bash)"' >> ~/.bashrc && \
    echo 'eval "$(zoxide init bash)"' >> ~/.bashrc && \
    echo 'alias ls="ls-eza"' >> ~/.bashrc && \
    echo 'alias cat="bat"' >> ~/.bashrc

# Buildah storage config (rootless)
RUN mkdir -p ~/.config/containers && \
    echo '[storage]' > ~/.config/containers/storage.conf && \
    echo 'driver = "overlay"' >> ~/.config/containers/storage.conf && \
    echo 'runroot = "/run/user/1000"' >> ~/.config/containers/storage.conf && \
    echo 'graphroot = "/home/developer/.local/share/containers/storage"' >> ~/.config/containers/storage.conf && \
    echo '[storage.options.overlay]' >> ~/.config/containers/storage.conf && \
    echo 'mount_program = "/usr/bin/fuse-overlayfs"' >> ~/.config/containers/storage.conf

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
USER root
RUN chmod +x /usr/local/bin/entrypoint.sh
USER developer

ENTRYPOINT ["entrypoint.sh"]
CMD ["opencode", "web", "--hostname", "0.0.0.0", "--port", "7681"]
