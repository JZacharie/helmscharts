# Kasm Workspaces Helm Chart

This Helm chart deploys Kasm Workspaces on Kubernetes with optional Vault integration for secret management.

## Features

- Full Kasm Workspaces deployment (API, Manager, Proxy, Guacamole, Database)
- Optional Vault integration for secure secret management
- Configurable Ingress support
- PostgreSQL database with persistent storage
- Optional RDP Gateway services
- Automated database initialization and backup

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- External Secrets Operator (if using Vault integration)
- Ingress controller (if using Ingress)

## Installation

### With Vault Integration

```bash
helm install kasm ./charts/kasm \
  --set vault.enabled=true \
  --set vault.auth.token="YOUR_VAULT_TOKEN" \
  --set publicAddr="kasm.yourdomain.com" \
  --set ingress.enabled=true
```

### Without Vault (Auto-generated secrets)

```bash
helm install kasm ./charts/kasm \
  --set publicAddr="kasm.yourdomain.com" \
  --set ingress.enabled=true
```

## Configuration

See `values.yaml` for all configuration options.

### Key Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `vault.enabled` | Enable Vault integration | `false` |
| `vault.address` | Vault server address | `https://vault.p.zacharie.org` |
| `publicAddr` | Public URL for Kasm | `""` |
| `ingress.enabled` | Enable Ingress | `false` |
| `deploymentSize` | Deployment size (small/medium/large) | `small` |

## Vault Secret Structure

When Vault integration is enabled, the following secrets must be created in Vault:

- `kasm/admin` - Admin credentials (key: `password`)
- `kasm/user` - Default user credentials (key: `password`)
- `kasm/database` - PostgreSQL password (key: `password`)
- `kasm/redis` - Redis password (key: `password`)
- `kasm/manager` - Manager service token (key: `token`)

## License

Based on the official Kasm Helm chart from kasmtech/kasm-helm
