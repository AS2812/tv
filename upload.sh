#!/bin/bash

# Create necessary directories if they don't exist
mkdir -p /var/www/dakka.me/Front-end/ser-app/src/hooks
mkdir -p /var/www/dakka.me/Front-end/ser-app/src/components/ui

# Update frontend files
cat > /var/www/dakka.me/Front-end/ser-app/index.html << 'EOL'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <title>دكّة - الجلسة الخارجية البسيطة</title>
    <link rel="stylesheet" href="/assets/index-B_KkCYYk.css">
    <script type="module" crossorigin src="/assets/index-CEZnNmWD.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOL

cat > /var/www/dakka.me/Front-end/ser-app/vite.config.mjs << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',  // Ensures assets are requested as /assets/...
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Ensure proper asset paths
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
EOL

cat > /var/www/dakka.me/Front-end/ser-app/src/hooks/useFetch.js << 'EOL'
import { useState, useEffect } from 'react';
import { defaultProfile } from '../utils/auth';

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Add credentials to include cookies
        const fetchOptions = {
          ...options,
          credentials: 'include',
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
          }
        };
        
        // Make sure URL is properly formatted
        const apiUrl = url.startsWith('http') ? url : url;
        
        const response = await fetch(apiUrl, fetchOptions);
        
        if (response.status === 401) {
          // Handle unauthorized gracefully
          console.log("User not authenticated, returning default profile");
          setData(defaultProfile);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("API fetch error:", err);
        setError(err.message || 'An error occurred');
        
        // For profile-related endpoints, use default profile on error
        if (url.includes('/api/auth/me') || url.includes('/profile')) {
          setData(defaultProfile);
        } else {
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

export default useFetch;
EOL

cat > /var/www/dakka.me/Front-end/ser-app/src/hooks/use-mobile.js << 'EOL'
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return !!isMobile
}
EOL

cat > /var/www/dakka.me/Front-end/ser-app/src/components/ui/button.jsx << 'EOL'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
EOL

# Update Nginx configuration
cat > /etc/nginx/sites-available/dakka.me << 'EOL'
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
EOL

# Create deployment script
cat > /var/www/dakka.me/deploy.sh << 'EOL'
#!/bin/bash

# Update frontend
cd /var/www/dakka.me/Front-end/ser-app
npm install
npm run build

# Update Nginx configuration
cat > /etc/nginx/sites-available/dakka.me << 'EOLL'
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
EOLL

# Ensure symlink exists
ln -sf /etc/nginx/sites-available/dakka.me /etc/nginx/sites-enabled/dakka.me

# Set permissions
chmod -R 755 /var/www/dakka.me/Front-end/ser-app/dist

# Restart Nginx
nginx -t && systemctl restart nginx

echo "Deployment completed successfully!"
EOL

# Make deployment script executable
chmod +x /var/www/dakka.me/deploy.sh

echo "All files have been uploaded and configured successfully!"
