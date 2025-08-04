server {
    listen 80;
    server_name dakka.me www.dakka.me;
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
    
    # Properly handle MIME types
    include /etc/nginx/mime.types;
    
    # Better API proxy with CORS support
    location /api/ {
        proxy_pass https://58hpi8c7n3pj.manus.space/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host 58hpi8c7n3pj.manus.space;
        proxy_set_header Origin "https://58hpi8c7n3pj.manus.space";
        proxy_set_header Referer "https://58hpi8c7n3pj.manus.space";
        proxy_cookie_domain 58hpi8c7n3pj.manus.space dakka.me;
        proxy_pass_header Set-Cookie;
    }
    
    # Handle all HTML requests with the index.html file
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Ensure static assets are properly served with correct headers
    location /assets/ {
        expires max;
        add_header Cache-Control "public, max-age=31536000";
        add_header Access-Control-Allow-Origin "*";
    }
}
