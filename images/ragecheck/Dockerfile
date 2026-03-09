# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install git to clone the repository
RUN apk add --no-cache git

# Clone the repository
RUN git clone --depth 1 https://github.com/aagoldberg/ragecheck.git .

# Patch TypeScript error in poll-collector.ts
# It tries to access properties on a type that TypeScript thinks is {}
RUN node -e "const fs = require('fs'); \
    const fn = 'src/lib/agents/survey/poll-collector.ts'; \
    const content = fs.readFileSync(fn, 'utf8'); \
    fs.writeFileSync(fn, content.replace(/parsed\./g, '(parsed as any).'));"

# Install dependencies
# Using npm clean-install for reproducible builds
RUN npm ci --prefer-offline --no-audit

# Build the Next.js application
RUN npm run build

# Stage 2: Production
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose the port
EXPOSE 3000

# Set user to node for security
USER node

# Start the application
CMD ["npm", "start"]
