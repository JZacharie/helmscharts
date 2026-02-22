# Optimized OpenCode image with dev tools (Debian-based for glibc compatibility)
# This fixes native module loading issues (like bun-pty) found in Alpine
FROM debian:bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    openssh-client \
    python3 \
    python3-pip \
    unzip \
    jq \
    ca-certificates \
    musl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy opencode from official Alpine-based image
# Note: The binary is musl-linked, but the native modules it extracts require glibc.
# The 'musl' package on Debian provides the necessary runtime for the main binary.
COPY --from=ghcr.io/anomalyco/opencode:latest /usr/local/bin/opencode /usr/local/bin/opencode

# Install kubectl (latest stable)
RUN KUBECTL_VERSION=$(curl -fsSL https://dl.k8s.io/release/stable.txt) && \
    curl -fsSL -o /usr/local/bin/kubectl \
    "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    chmod +x /usr/local/bin/kubectl

# Install Helm
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Terraform (latest)
RUN TERRAFORM_VERSION=$(curl -fsSL https://api.releases.hashicorp.com/v1/releases/terraform/latest \
    | jq -r '.version') && \
    curl -fsSL -o /tmp/terraform.zip \
    "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" && \
    unzip -o /tmp/terraform.zip -d /usr/local/bin/ && \
    rm /tmp/terraform.zip

# Setup user and directories
RUN groupadd -g 1000 opencode && \
    useradd -m -u 1000 -g opencode -s /bin/bash opencode && \
    mkdir -p /home/opencode/workspace && \
    chown -R opencode:opencode /home/opencode

# Environment
ENV HOME=/home/opencode
USER opencode
WORKDIR /home/opencode

# Default entrypoint
ENTRYPOINT ["opencode"]
CMD ["web", "--hostname", "0.0.0.0", "--port", "7681"]
