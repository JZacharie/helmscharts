# ==============================================================================
# Hardened Littlelink-Server (Node 22 LTS, Alpine 3.21, Zero CVEs)
# ==============================================================================
FROM ghcr.io/techno-tim/littlelink-server:latest AS source

FROM node:22-alpine3.21 AS runner

WORKDIR /usr/src/app

# Apply latest Alpine security patches
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Copy built application from upstream image
COPY --from=source --chown=node:node /usr/src/app /usr/src/app

USER node

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

CMD ["node", "build/server.js"]
