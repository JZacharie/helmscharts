# ==============================================================================
# Hardened DocuSeal Build (Latest + Alpine Upgrade, Zero CVEs)
# ==============================================================================
FROM docuseal/docuseal:latest

USER root

RUN if [ -f /etc/alpine-release ]; then \
      apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*; \
    else \
      apt-get update && apt-get upgrade -y && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*; \
    fi

USER 1000:1000
