FROM ghcr.io/oguzhan-yilmaz/steampipe-powerpipe-kubernetes--powerpipe:latest

USER root
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://powerpipe.io/install/powerpipe.sh | sh -s -- -v 1.4.2 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
