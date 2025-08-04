upstream dakka_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name dakka.me www.dakka.me;

    # Serve the built React app
    root /opt/ser-app/dist;
    index index.html;

    # Front-end SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static asset caching
    location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires    max;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Proxy API to backend
    location /api/ {
        proxy_pass         http://dakka_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
