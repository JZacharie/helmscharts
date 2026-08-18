# ==============================================================================
# Hardened NocoDB Build (Security Patched Debian Bookworm)
# ==============================================================================
FROM nocodb/nocodb:0.262.5

# Apply all latest Debian Bookworm security updates (OpenSSL, GnuTLS, Node, Libc)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
