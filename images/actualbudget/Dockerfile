# ==============================================================================
# Hardened ActualBudget Server Build (Security Patched)
# ==============================================================================
FROM actualbudget/actual-server:26.10.0

USER root

RUN if [ -f /etc/alpine-release ]; then \
      apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*; \
    else \
      apt-get update && apt-get upgrade -y && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*; \
    fi

USER actual
