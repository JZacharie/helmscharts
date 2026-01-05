# Multi-stage Dockerfile for KEDA Waiting Page
FROM python:3.14-slim as backend-builder

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/server.py .

# Production stage
FROM python:3.14-slim

# Install nginx
RUN apt-get update && \
    apt-get install -y nginx && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn

# Copy backend
COPY backend/server.py .

# Copy frontend
COPY frontend /usr/share/nginx/html

# Configure nginx
RUN echo 'server { \n\
    listen 80; \n\
    server_name _; \n\
    \n\
    # Frontend \n\
    location / { \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    # Backend API \n\
    location /api/ { \n\
    proxy_pass http://127.0.0.1:8080; \n\
    proxy_set_header Host $host; \n\
    proxy_set_header X-Real-IP $remote_addr; \n\
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \n\
    proxy_set_header X-Forwarded-Proto $scheme; \n\
    } \n\
    \n\
    # Health check \n\
    location /health { \n\
    proxy_pass http://127.0.0.1:8080; \n\
    } \n\
    }' > /etc/nginx/sites-available/default

# Create startup script
RUN echo '#!/bin/bash\n\
    set -e\n\
    \n\
    # Start backend API\n\
    gunicorn --bind 127.0.0.1:8080 --workers 2 --timeout 60 server:app &\n\
    \n\
    # Start nginx\n\
    nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
