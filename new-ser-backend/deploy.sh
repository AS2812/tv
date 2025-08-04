#!/bin/bash

# Update backend
cd /var/www/dakka.me/Back-end/new-ser-backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart dakka-backend.service

# Update frontend
cd /var/www/dakka.me/Front-end/ser-app
npm install
npm run build

# Restart nginx
systemctl restart nginx

echo "Deployment completed successfully!"
