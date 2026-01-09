# Fundy Helm Chart

Helm chart for deploying the Fundy application, a financial data analysis platform with microservices architecture.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- GitHub Container Registry access (for pulling private images)

## Installation

### 1. Create Image Pull Secret

Create a Kubernetes secret to authenticate with GitHub Container Registry:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<your-github-token> \
  --namespace=<your-namespace>
```

To generate a GitHub token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `read:packages` scope

### 2. Configure Values

Copy the example values file and fill in your configuration:

```bash
cp values.yaml.example values.yaml
```

Edit `values.yaml` and fill in all environment variables from your `.env.secrets` file. The values file includes:

- **Database configurations** (ClickHouse, PostgreSQL)
- **AWS credentials** (S3, Cognito)
- **API keys** (Gleap, Amplitude, OpenAI, etc.)
- **Monitoring** (Sentry, OpenTelemetry)
- **Resource limits** for each service

### 3. Install the Chart

Install the chart with your custom values:

```bash
# From the helmscharts repository
helm install fundy ./charts/fundy \
  --values /path/to/your/values.yaml \
  --namespace fundy \
  --create-namespace
```

Or if you want to test first:

```bash
# Dry-run to verify the manifests
helm install fundy ./charts/fundy \
  --values /path/to/your/values.yaml \
  --namespace fundy \
  --dry-run --debug
```

### 4. Upgrade the Chart

To upgrade an existing installation:

```bash
helm upgrade fundy ./charts/fundy \
  --values /path/to/your/values.yaml \
  --namespace fundy
```

## Components

The chart deploys the following microservices:

- **analytics** - Analytics service for data processing
- **jobs** - Job scheduling and management service
- **reports** - Report generation service
- **users** - User management service (integrates with AWS Cognito)
- **frontend** - Web application frontend
- **optimizer** - Portfolio optimization service
- **builder** - Strategy builder service
- **data** - Data ingestion and processing service

## Configuration

### Image Configuration

By default, the chart uses the following images:

```yaml
images:
  analytics:
    repository: ghcr.io/stainly/fundy/analytics
    tag: sha-6e9f6c2
  # ... (other services)
```

### Ingress

The chart includes an optional Ingress resource for path-based routing:

- `/api/analytics` → analytics service
- `/api/jobs` → jobs service
- `/api/reports` → reports service
- `/api/users` → users service
- `/api/builder` → builder service
- `/api/data` → data service
- `/` → frontend service

To enable ingress:

```yaml
ingress:
  enabled: true
  className: "nginx"  # or your ingress controller
  hosts:
    - host: fundy.yourdomain.com
```

### Resource Limits

Default resource limits are conservative. Adjust based on your workload:

```yaml
resources:
  analytics:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"
```

The `optimizer` and `builder` services have higher default limits due to computational requirements.

### Health Checks

All services include liveness and readiness probes:

```yaml
healthcheck:
  enabled: true
  path: /health
  initialDelaySeconds: 40
  periodSeconds: 30
```

## Uninstallation

To remove the deployment:

```bash
helm uninstall fundy --namespace fundy
```

## Development

### Template Validation

To validate the templates without installing:

```bash
helm template fundy . --values values.yaml.example
```

### Lint the Chart

```bash
helm lint .
```

## Architecture

```
┌─────────────┐
│   Ingress   │
└─────┬───────┘
      │
      ├─────────────────────────────────────┐
      │                                     │
┌─────▼─────┐  ┌──────────┐  ┌──────────┐ │
│ Frontend  │  │Analytics │  │  Jobs    │ │
└─────┬─────┘  └────┬─────┘  └────┬─────┘ │
      │             │              │        │
      │    ┌────────┴────────┬─────┴───┐   │
      │    │                 │         │   │
┌─────▼────▼──┐  ┌──────────▼───┐  ┌─▼───▼──┐
│   Builder   │  │  Optimizer   │  │  Data  │
└──────┬──────┘  └──────────────┘  └────────┘
       │
┌──────▼──────┐
│   Reports   │
└─────────────┘
       │
┌──────▼──────┐
│    Users    │
└─────────────┘
```

## Support

For issues or questions, please contact the maintainers or open an issue in the repository.

## License

See the main repository for license information.
