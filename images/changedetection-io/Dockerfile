# ==============================================================================
# Hardened Changedetection.io Build (Security Patched)
# ==============================================================================
FROM ghcr.io/dgtlmoon/changedetection.io:0.54.7

USER root

RUN if [ -f /etc/alpine-release ]; then \
      apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*; \
    else \
      apt-get update && apt-get upgrade -y && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*; \
    fi
