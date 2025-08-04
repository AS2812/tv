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
    
    # Important MIME types
    include /etc/nginx/mime.types;
    
    # Additional MIME types
    types {
        text/css css;
        application/javascript js mjs;
    }
    
    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # CSS files
    location ~ \.css$ {
        add_header Content-Type text/css;
        try_files $uri =404;
    }
    
    # JavaScript files
    location ~ \.js$ {
        add_header Content-Type application/javascript;
        try_files $uri =404;
    }
    
    # For static assets
    location /assets/ {
        expires max;
        add_header Cache-Control "public, max-age=31536000";
    }
    
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
        proxy_set_header Origin "https://58hpi8c7n3pj.manus.space";
        proxy_set_header Referer "https://58hpi8c7n3pj.manus.space";
    }
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
