server {
    listen 80;
    server_name dakka.me www.dakka.me;
    
    # Frontend
    root /var/www/dakka.me/Front-end/ser-app/dist;
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
        proxy_cache_bypass $http_upgrade;
    }
}
        add_header Cache-Control "public, max-age=31536000";
    }
}
