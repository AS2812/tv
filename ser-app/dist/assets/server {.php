server {
    listen 80;
    server_name dakka.me www.dakka.me;

    # Serve the Vite build
    root /opt/ser-app/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets (cacheable)
    location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires    max;
        add_header Cache-Control "public, max-age=31536000";
    }

    # API proxy if needed
    # location /api/ {
    #     proxy_pass http://127.0.0.1:8000/api/;
    #     proxy_http_version 1.1;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # }
}
