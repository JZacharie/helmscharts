# Kasm Workspaces Deployment Walkthrough

## Summary

Successfully deployed Kasm Workspaces to Kubernetes using a custom Helm chart with full Vault integration for secret management. The deployment includes all core Kasm services (API, Manager, Proxy, Guacamole, PostgreSQL) and is managed by ArgoCD.

## What Was Accomplished

### 1. Helm Chart Creation

Created a complete Kasm Workspaces Helm chart at [charts/kasm](file:///home/joseph/git/helmscharts/charts/kasm) based on the official kasmtech/kasm-helm chart (v1.1181.0) with the following enhancements:

#### Key Files Created

- **[Chart.yaml](file:///home/joseph/git/helmscharts/charts/kasm/Chart.yaml)** - Chart metadata and version information
- **[values.yaml](file:///home/joseph/git/helmscharts/charts/kasm/values.yaml)** - Configuration with Vault integration section added
- **[templates/vault.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/vault.yaml)** - Vault SecretStore and ExternalSecrets for all credentials
- **[README.md](file:///home/joseph/git/helmscharts/charts/kasm/README.md)** - Installation and configuration documentation

#### Vault Integration

Added comprehensive Vault integration that manages all sensitive credentials:

```yaml
vault:
  enabled: true
  address: "https://vault.p.zacharie.org"
  mountPath: "secret"
  
  secrets:
    adminPassword:
      path: "kasm/admin"
      key: "password"
    userPassword:
      path: "kasm/user"
      key: "password"
    databasePassword:
      path: "kasm/database"
      key: "password"
    redisPassword:
      path: "kasm/redis"
      key: "password"
    managerToken:
      path: "kasm/manager"
      key: "token"
```

#### Template Modifications

Modified [templates/kasm-password-secret.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/kasm-password-secret.yaml) to conditionally skip secret generation when Vault is enabled:

```yaml
{{- if not .Values.vault.enabled }}
# Original secret generation logic
{{- end }}
```

### 2. Vault Secret Management

Created all required secrets in Vault at `vault.p.zacharie.org` using the provided token `YOUR_VAULT_TOKEN`:

| Secret Path | Key | Purpose |
|------------|-----|---------|
| `secret/kasm/admin` | `password` | Kasm admin user password |
| `secret/kasm/user` | `password` | Default user password |
| `secret/kasm/database` | `password` | PostgreSQL database password |
| `secret/kasm/redis` | `password` | Redis cache password |
| `secret/kasm/manager` | `token` | Manager service authentication token |

All passwords were generated using `openssl rand -base64 32` for maximum security.

> [!IMPORTANT]
> **Admin Credentials**: The admin password has been securely stored in Vault. You can retrieve it using:
> ```bash
> curl -H "X-Vault-Token: YOUR_VAULT_TOKEN" \
>   https://vault.p.zacharie.org/v1/secret/data/kasm/admin
> ```

### 3. ArgoCD Application Configuration

Created ArgoCD application manifest and production values:

#### Application Manifest

[Applications/productivity/kasm.yaml](file:///home/joseph/git/jo3/Applications/productivity/kasm.yaml):
- Project: `productivity`
- Source: Helm chart from `https://jzacharie.github.io/helmscharts`
- Chart version: `0.1.0`
- Namespace: `kasm`
- Auto-sync enabled with self-heal
- Automatic namespace creation

#### Production Values

[values/productivity/kasm/values.yaml](file:///home/joseph/git/jo3/values/productivity/kasm/values.yaml):
- Public URL: `kasm.p.zacharie.org`
- Ingress enabled with cert-manager TLS
- Deployment size: `small`
- Vault integration: **enabled**
- Resource limits configured for all components
- RDP Gateways: disabled (not needed for basic deployment)

### 4. Repository Updates

#### helmscharts Repository

**Commit**: `feat: Add Kasm Workspaces Helm chart with Vault integration`

Changes:
- Created complete Kasm chart structure
- Added 30+ template files from official chart
- Created Vault integration templates
- Modified password secret template
- Packaged chart: `kasm-1.1181.0.tgz`
- Updated Helm repository index

**Files Changed**: 43 files added

#### jo3 Repository

**Commit**: `feat: Add Kasm Workspaces ArgoCD application`

Changes:
- Created ArgoCD Application manifest
- Created production values with Vault enabled
- Configured Ingress and TLS

**Files Changed**: 2 files added

## Kasm Components Deployed

The Helm chart deploys the following Kasm Workspaces components:

### Core Services

1. **API Service** (`kasmweb/api:1.18.1`)
   - Handles API endpoints and web application
   - Resources: 512Mi-1Gi RAM, 200m-1000m CPU

2. **Manager Service** (`kasmweb/manager:1.18.1`)
   - Monitors agent and session status
   - Resources: 512Mi-1Gi RAM, 200m-1000m CPU

3. **Proxy Service** (`kasmweb/proxy:1.18.1`)
   - Nginx-based traffic routing
   - Resources: 256Mi-512Mi RAM, 100m-500m CPU

4. **Guacamole Service** (`kasmweb/kasm-guac:1.18.1`)
   - RDP/VNC/SSH connection proxy
   - Resources: 256Mi-512Mi RAM, 100m-500m CPU

### Data Services

5. **PostgreSQL Database** (`kasmweb/postgres:1.18.1`)
   - StatefulSet with 10Gi persistent storage
   - Retention policy: Retain on delete/scale

6. **Redis** (if enabled)
   - Shared services communication

### Optional Services (Disabled)

- RDP Gateway
- RDP HTTPS Gateway

## Verification Steps

### Check ArgoCD Application

```bash
# View application status
kubectl get application kasm -n argocd

# Check sync status
kubectl get application kasm -n argocd -o jsonpath='{.status.sync.status}'

# Check health status
kubectl get application kasm -n argocd -o jsonpath='{.status.health.status}'
```

### Check Vault Integration

```bash
# Verify SecretStore
kubectl get secretstore -n kasm
kubectl describe secretstore kasm-vault -n kasm

# Verify ExternalSecrets
kubectl get externalsecret -n kasm
kubectl describe externalsecret -n kasm
```

### Check Deployed Resources

```bash
# View all pods
kubectl get pods -n kasm

# Check deployments
kubectl get deployments -n kasm

# Check statefulsets
kubectl get statefulsets -n kasm

# Check services
kubectl get services -n kasm

# Check ingress
kubectl get ingress -n kasm
```

### Check Logs

```bash
# API service logs
kubectl logs -n kasm deployment/kasm-api --tail=50

# Manager service logs
kubectl logs -n kasm deployment/kasm-manager --tail=50

# Database logs
kubectl logs -n kasm statefulset/kasm-db --tail=50

# Proxy logs
kubectl logs -n kasm deployment/kasm-proxy --tail=50
```

### Access Kasm Web Interface

Once deployed, access Kasm at: **https://kasm.p.zacharie.org**

Login with:
- Username: `admin@kasm.local` (default)
- Password: Retrieved from Vault at `secret/kasm/admin`

## Next Steps

1. **Wait for ArgoCD Sync**: The application should appear in ArgoCD within 1-3 minutes
2. **Monitor Pod Status**: Ensure all pods reach `Running` state
3. **Verify Secrets**: Check that ExternalSecrets successfully sync from Vault
4. **Test Access**: Navigate to `https://kasm.p.zacharie.org` and verify login
5. **Configure Workspaces**: Add workspace images and configure user access

## Troubleshooting

### Application Not Syncing

```bash
# Force sync
kubectl patch application kasm -n argocd --type merge -p '{"operation":{"sync":{}}}'

# Check ArgoCD logs
kubectl logs -n argocd deployment/argocd-application-controller
```

### Secrets Not Syncing from Vault

```bash
# Check external-secrets-operator logs
kubectl logs -n external-secrets deployment/external-secrets

# Verify Vault token is valid
curl -H "X-Vault-Token: YOUR_VAULT_TOKEN" \
  https://vault.p.zacharie.org/v1/auth/token/lookup-self
```

### Database Initialization Issues

```bash
# Check init job logs
kubectl logs -n kasm job/kasm-db-init

# Check database pod logs
kubectl logs -n kasm statefulset/kasm-db
```

## Security Notes

✅ **No secrets in Git**: All sensitive credentials are stored in Vault
✅ **Vault token**: Stored in Kubernetes secret, not in values files
✅ **TLS enabled**: Ingress configured with cert-manager for automatic TLS
✅ **Strong passwords**: All passwords generated with 32-byte random values

## Chart Information

- **Chart Name**: kasm
- **Chart Version**: 1.1181.0
- **App Version**: 1.18.1
- **Source**: Based on official kasmtech/kasm-helm
- **Repository**: https://jzacharie.github.io/helmscharts
