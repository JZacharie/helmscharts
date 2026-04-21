# syntax=docker/dockerfile:1.7
FROM debian:13-slim

ARG ALLOW_INSECURE_TLS=0
ARG APP_UID=10001
ARG APP_GID=10001

# Enable apt caching to work correctly with buildkit cache mounts
RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache

# Use Debian-native package installation to avoid TLS/repo issues seen with tdnf
# on the Azure Linux base image.
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg; \
    curl_flags='-fsSL'; \
    if [ "$ALLOW_INSECURE_TLS" = '1' ]; then \
        curl_flags='-fsSLk'; \
        printf 'Acquire::https::packages.microsoft.com::Verify-Peer "false";\nAcquire::https::packages.microsoft.com::Verify-Host "false";\n' > /etc/apt/apt.conf.d/99packages-microsoft-insecure; \
    fi; \
    . /etc/os-release; \
    curl $curl_flags https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft.gpg; \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ ${VERSION_CODENAME} main" > /etc/apt/sources.list.d/azure-cli.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        azure-cli=2.74.0-1~bookworm \
        bash \
        btop \
        coreutils \
        findutils \
        gawk \
        grep \
        gzip \
        jq \
        passwd \
        python3 \
        python3-pip \
        sed \
        tar \
        tzdata \
        util-linux \
        zip \
        unzip; \
    apt-mark hold azure-cli

# Install azcopy
RUN set -eux; \
    curl -sSL "https://aka.ms/downloadazcopy-v10-linux" -o /tmp/azcopy.tar.gz; \
    tar -xf /tmp/azcopy.tar.gz -C /tmp; \
    cp /tmp/azcopy_linux_*/azcopy /usr/local/bin/; \
    chmod +x /usr/local/bin/azcopy; \
    rm -rf /tmp/azcopy_linux_* /tmp/azcopy.tar.gz

# Create user
RUN set -eux; \
    groupadd --gid "${APP_GID}" appuser; \
    useradd --uid "${APP_UID}" --gid "${APP_GID}" --create-home --home-dir /home/appuser --shell /bin/bash appuser; \
    mkdir -p /work; \
    chown -R appuser:appuser /work /home/appuser

# Quick sanity check of mandatory commands.
RUN bash -lc 'for cmd in bash az azcopy awk find du grep sed sort tail head wc tr python3 pip3 btop zip unzip; do command -v "$cmd" >/dev/null || exit 1; done'

ENV HOME=/home/appuser
WORKDIR /work
USER appuser

# Keep shell entrypoint for CronJob command compatibility.
ENTRYPOINT ["/bin/bash"]
