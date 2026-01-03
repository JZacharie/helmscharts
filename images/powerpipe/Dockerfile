# Powerpipe v1.4.2 - Updated on 2026-01-03
FROM ghcr.io/oguzhan-yilmaz/steampipe-powerpipe-kubernetes--powerpipe:latest

USER root
RUN rm -f /usr/local/bin/powerpipe && \
    apt-get update && apt-get install -y curl && \
    curl -fsSL https://powerpipe.io/install/powerpipe.sh | sh -s -- v1.4.2 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
