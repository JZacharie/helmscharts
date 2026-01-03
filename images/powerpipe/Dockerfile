# Powerpipe v1.4.2 - Updated on 2026-01-03
FROM ghcr.io/oguzhan-yilmaz/steampipe-powerpipe-kubernetes--powerpipe:latest

USER root
# Remove all existing powerpipe binaries and install v1.4.2
RUN rm -f /usr/local/bin/powerpipe /home/powerpipe/powerpipe && \
    apt-get update && apt-get install -y curl && \
    curl -fsSL https://powerpipe.io/install/powerpipe.sh | sh -s -- v1.4.2 && \
    # Copy the new binary to /home/powerpipe for compatibility with entrypoint scripts
    cp /usr/local/bin/powerpipe /home/powerpipe/powerpipe && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

ENTRYPOINT ["/usr/local/bin/start.sh"]
CMD ["powerpipe", "server", "--ip", "0.0.0.0", "--port", "9033"]
