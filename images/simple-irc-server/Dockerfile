FROM rust:1.93-bookworm as builder

WORKDIR /usr/src/simple-irc-server

# Copy local source
COPY src/Cargo.toml .
COPY src/src ./src
COPY src/config-example.toml .

# Build release binary with default features (dns_lookup, tls_rustls are defaults or can be enabled)
# README says: cargo build --release --features=dns_lookup,tls_rustls
RUN cargo build --release --features=dns_lookup,tls_rustls

FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies if needed (ca-certificates for TLS)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/simple-irc-server/target/release/simple-irc-server /usr/local/bin/

# Create a default config directory
RUN mkdir -p /etc/simple-irc-server

# Expose default IRC port
EXPOSE 6667

CMD ["simple-irc-server", "-c", "/etc/simple-irc-server/config.toml"]
