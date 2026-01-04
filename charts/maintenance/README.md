# Node Maintenance

This directory contains Kubernetes resources for automated cluster node maintenance.

## Components

### CronJob: node-maintenance

Automated maintenance job that runs daily at 3 AM to:

1. **Clean up unused container images** on all nodes using `crictl rmi --prune`
2. **Update OS packages** on nodes:
   - **Debian/Ubuntu systems**: Runs `apt update && apt upgrade -y`
   - **Read-only systems (Kairos)**: Skips package updates (use [Kairos Kubernetes upgrades](https://kairos.io/docs/upgrade/kubernetes/) instead)

### Features

- **Automatic node discovery**: Uses kubectl to find all cluster nodes
- **SSH-based execution**: Connects to each node via SSH using the `joseph` user
- **OS detection**: Automatically detects Debian/Ubuntu vs read-only filesystems
- **Comprehensive logging**: Detailed output for each maintenance operation
- **Error handling**: Continues processing remaining nodes if one fails

### Security

- SSH private key stored in Kubernetes Secret (`ssh-key`)
- ServiceAccount with minimal RBAC permissions (node read-only)
- SSH key mounted with secure permissions (0400)

## Schedule

The CronJob runs on the following schedule:
- **Daily at 3 AM**: `0 3 * * *`

To modify the schedule, edit the `schedule` field in `node-maintenance-cronjob.yaml`.

## Manual Execution

To run the maintenance job manually:

```bash
kubectl create job --from=cronjob/node-maintenance manual-maintenance-$(date +%s) -n maintenance
```

## Monitoring

Check the status of recent jobs:

```bash
kubectl get jobs -n maintenance
```

View logs from the latest job:

```bash
kubectl logs -n maintenance -l app=node-maintenance --tail=100
```

## Prerequisites

- SSH access to all nodes using the `joseph` user
- `sudo` privileges for the `joseph` user on all nodes
- `crictl` installed on all nodes (standard with k3s)
