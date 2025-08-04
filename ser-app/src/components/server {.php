server {
    listen 80;
    server_name dakka.me www.dakka.me;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dakka.me www.dakka.me;
    
    ssl_certificate /etc/letsencrypt/live/dakka.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dakka.me/privkey.pem;
    
    root /opt/ser-app/dist;
    index index.html;
    
    include /etc/nginx/mime.types;
    
    # Enable gzip for better performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Serve mock API data from static JSON files
    location /api/ {
        root /opt/ser-app/dist;
        try_files $uri $uri/ /api/mock/$uri.json /api/mock/default.json =404;
    }
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Ensure assets are properly served
    location /assets/ {
        try_files $uri =404;
        expires max;
        add_header Cache-Control "public, max-age=31536000";
    }
}
