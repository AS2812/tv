#!/bin/bash

# Show server status
echo "=== Checking Server Status ==="
echo ""

# Check if backend service is running
echo "Backend Service Status:"
systemctl status dakka-backend.service | head -n 5
echo ""

# Check API health
echo "API Health Check:"
HEALTH=$(curl -s http://localhost:5000/api/health)
if [ -z "$HEALTH" ]; then
  echo "ERROR: API not responding"
else
  echo $HEALTH
fi
echo ""

# Check Nginx status
echo "Nginx Status:"
systemctl status nginx | head -n 5
echo ""

# Check recent Nginx errors
echo "Recent Nginx Errors:"
tail -n 10 /var/log/nginx/error.log
echo ""

# Check if the frontend is accessible
echo "Frontend Accessibility:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_CODE" == "200" ]; then
  echo "Frontend is accessible (HTTP 200)"
else
  echo "Frontend may have issues (HTTP $HTTP_CODE)"
fi
echo ""

# Check disk space
echo "Disk Space:"
df -h | grep -E '(Filesystem|/$)'
echo ""

# Check memory usage
echo "Memory Usage:"
free -h | head -n 2
echo ""

echo "=== Troubleshooting Tips ==="
echo "1. If backend service is not running: systemctl restart dakka-backend.service"
echo "2. If Nginx has errors: nginx -t && systemctl restart nginx"
echo "3. To rebuild frontend: cd /var/www/dakka.me/Front-end/ser-app && npm run build"
echo "4. To check logs continuously: journalctl -u dakka-backend.service -f"
echo ""
