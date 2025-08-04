server {
    listen 80;
    server_name dakka.me www.dakka.me;
    
    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dakka.me www.dakka.me;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/dakka.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dakka.me/privkey.pem;
    
    root /opt/ser-app/dist;
    index index.html;
    
    include /etc/nginx/mime.types;
    
    # Enable gzip for better performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # API proxy
    location /api/ {
        proxy_pass https://58hpi8c7n3pj.manus.space/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host 58hpi8c7n3pj.manus.space;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Ensure assets are properly served
    location /assets/ {
        try_files $uri =404;
        expires max;
        add_header Cache-Control "public, max-age=31536000";
        add_header Access-Control-Allow-Origin "*";
    }
}
