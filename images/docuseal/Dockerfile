# ==============================================================================
# Hardened DocuSeal Build (Security Patched)
# ==============================================================================
FROM docuseal/docuseal:1.8.6

USER root

# Apply latest security patches to base OS libraries
RUN if [ -f /etc/alpine-release ]; then \
      apk update && apk upgrade && rm -rf /var/cache/apk/*; \
    else \
      apt-get update && apt-get upgrade -y && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*; \
    fi

# Revert to standard unprivileged user if present, or keep default
USER docuseal
