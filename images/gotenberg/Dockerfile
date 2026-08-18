# ==============================================================================
# Hardened Gotenberg Build (Security Patched, Non-Root)
# ==============================================================================
FROM gotenberg/gotenberg:8.25.1

USER root

# Apply all latest upstream Debian security patches for OpenSSL, Chromium & PDF engines
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Revert to unprivileged gotenberg user
USER gotenberg

EXPOSE 3000
