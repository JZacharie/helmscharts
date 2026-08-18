# ==============================================================================
# Hardened DocuSeal Build (Security Patched)
# ==============================================================================
FROM docuseal/docuseal:1.8.6

# Apply all latest Alpine security patches for OpenSSL, Musl, Ruby, Libc
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*
