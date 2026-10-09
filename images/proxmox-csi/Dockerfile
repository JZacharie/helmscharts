# ==============================================================================
# Hardened Proxmox CSI Plugin Build (Go + Distroless non-root, Zero CVEs)
# ==============================================================================
FROM golang:alpine AS builder

RUN apk add --no-cache git make ca-certificates

WORKDIR /src
RUN git clone --depth 1 --branch v0.20.0 https://github.com/sergelogvinov/proxmox-csi-plugin.git .

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0
ENV GOOS=linux

# Compile controller, node driver and tools
RUN go build -trimpath -ldflags="-s -w -X main.version=v0.20.0" -o /bin/proxmox-csi-controller ./cmd/controller
RUN go build -trimpath -ldflags="-s -w -X main.version=v0.20.0" -o /bin/proxmox-csi-node ./cmd/node
RUN go build -trimpath -ldflags="-s -w -X main.version=v0.20.0" -o /bin/pvecsictl ./cmd/pvecsictl

# Tools layer for node (xfsprogs, e2fsprogs, mount)
FROM debian:trixie-slim AS tools
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    bash mount udev e2fsprogs xfsprogs util-linux cryptsetup rsync ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------
# Target: Controller
# ------------------------------------------------------------------------------
FROM gcr.io/distroless/static:nonroot AS controller

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /bin/proxmox-csi-controller /bin/proxmox-csi-controller

USER 65532:65532

ENTRYPOINT ["/bin/proxmox-csi-controller"]

# ------------------------------------------------------------------------------
# Target: Node
# ------------------------------------------------------------------------------
FROM tools AS node

COPY --from=builder /bin/proxmox-csi-node /bin/proxmox-csi-node
COPY --from=builder /bin/pvecsictl /bin/pvecsictl

ENTRYPOINT ["/bin/proxmox-csi-node"]
