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
    
    # Full CORS support
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    
    # Improved API proxy with authentication support
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
        
        # Critical for authentication
        proxy_cookie_domain 58hpi8c7n3pj.manus.space dakka.me;
        proxy_cookie_path / /;
        proxy_pass_header Set-Cookie;
        
        # Handle OPTIONS for CORS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000 always;
            add_header 'Content-Type' 'text/plain charset=UTF-8' always;
            add_header 'Content-Length' 0 always;
            return 204;
        }
    }
    
    # Serve static assets with proper caching
    location /assets/ {
        try_files $uri =404;
        expires max;
        add_header Cache-Control "public, max-age=31536000";
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
