# OpenCode optimized image with dev tools
# Base: official OpenCode Alpine image
# Added: git, curl, python3, kubectl, helm, terraform, bash, openssh
FROM ghcr.io/anomalyco/opencode:latest

# Install Alpine packages
RUN apk add --no-cache \
    git \
    curl \
    bash \
    openssh-client \
    python3 \
    py3-pip \
    unzip \
    jq \
    ca-certificates

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

# Create workspace directory
RUN mkdir -p /home/opencode/workspace

# Default entrypoint
ENTRYPOINT ["opencode"]
CMD ["web", "--hostname", "0.0.0.0", "--port", "7681"]
