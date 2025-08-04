# Frontend Dockerfile
FROM node:20-alpine as frontend-build

WORKDIR /app/frontend
COPY ser-app/package*.json ./
RUN npm ci

COPY ser-app/ ./
RUN npm run build

# Backend Dockerfile
FROM python:3.12-slim as backend

WORKDIR /app/backend
COPY new-ser-backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY new-ser-backend/ ./

# Final stage - Nginx to serve frontend and proxy backend
FROM nginx:alpine

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy backend files
COPY --from=backend /app/backend /app/backend

# Install Python in final stage for backend
RUN apk add --no-cache python3 py3-pip
RUN pip3 install --no-cache-dir -r /app/backend/requirements.txt

# Expose port
EXPOSE 80

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]