# Kairos Hadron NVIDIA Extension

This directory contains the custom build setup to layer NVIDIA GPU drivers and userspace components onto the musl-based **Kairos Hadron** OS image.

It compiles the NVIDIA open kernel modules against the specific kernel headers of the Kairos Hadron release and bundles the necessary userspace components (`nvidia-smi`, `nvidia-modprobe`, and libraries) using a glibc runtime shim.

---

## Architecture & Integration Details

### 1. Minimal Musl Distribution
Kairos Hadron is a from-scratch, minimal, musl-based Linux distribution with no package manager. Therefore:
* Kernel modules must be compiled from source against the exact kernel configuration/version during build.
* The matching `hadron-toolchain` image is used to fetch kernel headers and compile the open-gpu-kernel-modules.

### 2. Glibc Dynamic Linker Shim
NVIDIA userspace components (such as `nvidia-smi` and dynamic libraries) are linked against `glibc`.
* We extract Ubuntu 24.04 glibc libraries and the dynamic linker into `/usr/libc/lib` and `/usr/lib`.
* A custom dynamic linker configuration (`/etc/ld.so.conf`) is configured and compiled via `ldconfig` during build.
* Glibc-linked binaries automatically resolve to `/usr/libc/lib` at runtime.

### 3. Usr-Merge Symlink Trap
On Hadron, the filesystem root contains symlinks for system directories:
* `/sbin` $\rightarrow$ `/usr/bin`
* `/usr/sbin` $\rightarrow$ `/usr/bin`

**CRITICAL:** When compiling the image, we do **NOT** create a `/usr/sbin` directory in the builder stage. If a real directory is layered onto `/usr/sbin` via Docker `COPY --link`, BuildKit overlays it and breaks the symlink. This hides system binaries (like `/usr/sbin/modprobe`), which prevents auto-loading kernel modules and collapses the network stack (Cilium CNI setup fails).
* To resolve this safely, the real glibc `ldconfig` is placed directly at `/usr/bin/ldconfig`, which satisfies the NVIDIA Container Toolkit hook without breaking system symlinks.

### 4. Udev rules for `/dev/nvidia*`
Hadron's devtmpfs does not automatically spawn `/dev/nvidia*` character devices.
* We package a custom udev rule (`/etc/udev/rules.d/71-nvidia.rules`) that triggers `nvidia-modprobe -c 0` (for GPU device) and `nvidia-modprobe -u` (for UVM device) upon module initialization.

---

## Building the Image

### CI/CD Workflow
The GitHub Actions workflow (`.github/workflows/build-images.yaml`) automatically detects any subdirectory under `images/` containing a `Dockerfile`.
When a commit is pushed to `main`, the workflow will:
1. Parse `ARG VERSION=` from the Dockerfile.
2. Build the Dockerfile with Buildx.
3. Push the image to the GitHub Container Registry:
   `ghcr.io/jzacharie/kairos-hadron-nvidia:v0.2.0-standard-amd64-generic-v4.1.0-k3s-v1.36.0-k3s1`

### Local Build
To build the image manually on a local machine, run the following script:
```bash
HADRON_VERSION="v0.2.0"
NVIDIA_VERSION="580.126.20"
BASE_IMAGE="quay.io/kairos/hadron"
BASE_IMAGE_TAG="v0.2.0-standard-amd64-generic-v4.1.0-k3s-v1.36.0-k3s1"
IMAGE="ghcr.io/jzacharie/kairos-hadron-nvidia:${BASE_IMAGE_TAG}"

docker buildx build \
  -f images/kairos-hadron-nvidia/Dockerfile \
  --build-arg HADRON_VERSION="${HADRON_VERSION}" \
  --build-arg BASE_IMAGE="${BASE_IMAGE}" \
  --build-arg BASE_IMAGE_TAG="${BASE_IMAGE_TAG}" \
  --build-arg NVIDIA_VERSION="${NVIDIA_VERSION}" \
  --build-arg KERNEL_ARCH="x86_64" \
  --build-arg JOBS="$(nproc)" \
  --target hadron-extension \
  -t "${IMAGE}" \
  --push \
  .
```

---

## Deploying the NVIDIA GPU Operator (Driver-less)

Since the NVIDIA driver kernel modules and userspace libraries are already baked directly into the OS image, you **MUST** deploy the NVIDIA GPU Operator with the driver daemonset disabled.

Deploying the operator with host-level driver installation enabled will overwrite the custom kernel modules and break the node.

### Helm Configuration
Use the driver-less configuration values below:

```yaml
# values.yaml for nvidia-gpu-operator
driver:
  enabled: false

toolkit:
  enabled: true
  # Map to the custom ldconfig location
  env:
    - name: LDCONFIG_PATH
      value: "/usr/bin/ldconfig"

# Optional: Specify operator version v25.10.1 to avoid conflicts
```

Deploy the operator using Helm:
```bash
helm upgrade --install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --create-namespace \
  --version v25.10.1 \
  -f values.yaml
```

---

## Verification

1. **Verify Driver Load & GPU communication:**
   SSH into the deployed node and run:
   ```bash
   nvidia-smi
   ```
   This should report your GPU model, memory usage, and driver version `580.126.20`.

2. **Verify Container Runtime Integration:**
   Deploy a test GPU Pod to ensure Kubernetes schedules it correctly:
   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: gpu-test
   spec:
     restartPolicy: OnFailure
     containers:
     - name: cuda-container
       image: nvcr.io/nvidia/k8s/cuda-sample:vectoradd-cuda12.5.0
       resources:
         limits:
           nvidia.com/gpu: 1
   ```
