# Antigravity Remote Docker

A high-performance, GPU-accelerated lightweight Linux desktop environment designed for running Google Antigravity remotely. This project provides a Dockerized XFCE desktop accessible via web browser (noVNC) or standard VNC client, complete with NVIDIA GPU passthrough and Google Chrome.

## Features

*   **GPU Acceleration**: Full NVIDIA GPU passthrough support for high-performance rendering.
*   **Web Access**: Zero-install access via any modern web browser using noVNC.
*   **Google Chrome**: Pre-installed and configured for the containerized environment.
*   **Automated Workflow**: Antigravity launches automatically (maximized) upon startup.
*   **Optimized UI**: Minimalist, distraction-free desktop panel configuration.
*   **Persistent**: User workspace and configurations persist across container restarts.
*   **Resource Efficient**: Includes idle monitoring to optimize resource usage when inactive.

## Prerequisites

Before running this container, ensure your host system verifies the following requirements:

*   **Docker**: Docker Desktop (Windows/Mac) or Docker Engine (Linux).
*   **NVIDIA GPU**: An NVIDIA graphics card with up-to-date drivers installed on the host.
*   **NVIDIA Container Toolkit**: Required for GPU passthrough to Docker containers.

## Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/antigravity-remote-docker.git
    cd antigravity-remote-docker
    ```

2.  **Configure Environment**
    Copy the example configuration file and update it with your preferences.
    ```bash
    cp .env.example .env
    ```
    *Edit `.env` and set a secure `VNC_PASSWORD`.*

3.  **Build and Run**
    ```bash
    docker-compose up -d --build
    ```

## Usage

Once the container is running, you can access the desktop environment:

### Web Browser (noVNC)
Access the desktop directly from your browser. This method supports auto-login and adjusts resolution to your window size.
*   **URL**: `http://localhost:6080`

### VNC Client
For better performance or specific keyboard shortcuts, use a standalone VNC client (e.g., RealVNC, TightVNC).
*   **Address**: `localhost:5901`
*   **Password**: The value set in `VNC_PASSWORD` (default: `antigravity`)

## Configuration

Control the container behavior using the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `VNC_PASSWORD` | Password for VNC connection | `antigravity` |
| `DISPLAY_WIDTH` | Default horizontal resolution | `1920` |
| `DISPLAY_HEIGHT` | Default vertical resolution | `1080` |
| `AUTOSTART_ANTIGRAVITY` | Launch app on startup | `true` |
| `IDLE_TIMEOUT` | Seconds before idle state | `60` |

## Customization

### Desktop Panel
The XFCE desktop panel is pre-configured for a minimalist workflow:
*   **Top Panel**: Hidden by default (Autohide enabled).
*   **Bottom Panel**: Contains only Google Chrome and Antigravity launchers.

To customize the panel layout for all future instances, edit the configuration file:
`config/xfce4-panel.xml`

## Troubleshooting

**GPU Not Detected**
Ensure the NVIDIA Container Toolkit is correctly installed and `nvidia-smi` works on your host machine.

**Container Exits Immediately**
Check the logs for errors:
```bash
docker logs antigravity-remote
```

**Panel Changes Not Persisting**
If you manually edit the panel, restart the container to ensure changes are saved to the persistent volume:
```bash
docker-compose restart
```

## Directory Structure
```
.
├── config/             # Configuration files (Supervisord, XFCE)
├── scripts/            # Startup and utility scripts
├── data/               # Persistent storage (ignored by git)
├── Dockerfile          # Image definition
├── docker-compose.yml  # Container orchestration
└── .env                # Local environment variables
```
