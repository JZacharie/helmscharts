# Multi-stage Dockerfile for KEDA Waiting Page
FROM python:3.11-slim as backend-builder

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/server.py .

# Production stage
FROM python:3.11-slim

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

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-site.conf /etc/nginx/sites-available/default

# Prepare directories and permissions for non-root user
RUN mkdir -p /tmp/client_body \
             /tmp/proxy \
             /tmp/fastcgi \
             /tmp/uwsgi \
             /tmp/scgi && \
    touch /tmp/nginx.pid && \
    chown -R www-data:www-data /usr/share/nginx/html && \
    chown -R www-data:www-data /tmp && \
    chmod -R 777 /tmp

# Create startup script
RUN echo '#!/bin/bash\n\
    set -e\n\
    \n\
    # Start backend API\n\
    gunicorn --bind 127.0.0.1:8080 --workers 2 --timeout 60 server:app &\n\
    \n\
    # Start nginx\n\
    nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

EXPOSE 8081

# Switch to non-root user (optional, but good practice if not enforced by runtime)
# USER www-data

CMD ["/start.sh"]
