#!/bin/bash

# Modern deployment script for Dakka project
set -e

echo "🚀 Deploying Dakka to production server..."

# Configuration - Update these paths for your server
DEPLOY_PATH="/var/www/dakka.me"
FRONTEND_PATH="$DEPLOY_PATH/ser-app"
BACKEND_PATH="$DEPLOY_PATH/new-ser-backend"
NGINX_SITE="dakka.me"

# Update frontend
echo "📦 Updating frontend..."
cd "$FRONTEND_PATH"
git pull origin main
npm ci
NODE_ENV=production npm run build

# Update backend
echo "🐍 Updating backend..."
cd "$BACKEND_PATH"
git pull origin main
pip install -r requirements.txt

# Restart backend service
echo "🔄 Restarting backend service..."
sudo systemctl restart dakka-backend.service || echo "⚠️  Backend service not configured"

# Update Nginx configuration
echo "🌐 Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null << 'EOL'
server {
    listen 80;
    server_name dakka.me www.dakka.me;
    
    # Frontend
    root /var/www/dakka.me/ser-app/dist;
    index index.html;
    
    # Enable gzip for better performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Ensure assets are properly served
    location /assets/ {
        try_files $uri =404;
        expires max;
        add_header Cache-Control "public, max-age=31536000";
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Chat endpoints
    location /chat {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOL

# Ensure symlink exists
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/$NGINX_SITE

# Set permissions
sudo chmod -R 755 "$FRONTEND_PATH/dist"

# Test and restart Nginx
echo "🔧 Testing and restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Deployment completed successfully!"
echo "🌐 Site should be available at: http://dakka.me"
echo "📊 Check status with: ./check_status.sh"
