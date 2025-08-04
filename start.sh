#!/bin/sh

# Start Flask backend in background
cd /app/backend
python3 -m src.main &

# Start Nginx in foreground
nginx -g "daemon off;"