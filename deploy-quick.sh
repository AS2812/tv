#!/bin/bash

# Quick deployment script for the Dakka application
set -e

echo "🚀 Starting Dakka deployment process..."

# Check requirements
echo "📋 Checking requirements..."
node --version || { echo "❌ Node.js not found. Please install Node.js 20+"; exit 1; }
python3 --version || { echo "❌ Python not found. Please install Python 3.12+"; exit 1; }

# Build frontend
echo "🔨 Building frontend..."
cd ser-app
npm install
NODE_ENV=production npm run build
cd ..

# Test backend
echo "🧪 Testing backend..."
cd new-ser-backend
pip install -r requirements.txt
python3 -c "from src.main import create_app; app = create_app(); print('✅ Backend test passed')"
cd ..

echo "✅ Build completed successfully!"
echo ""
echo "📁 Built files are ready in ser-app/dist/"
echo ""
echo "🚀 Deployment options:"
echo "  1. GitHub Pages: Push to main branch (automatic)"
echo "  2. Docker: docker build -t dakka-app . && docker run -p 80:80 dakka-app"
echo "  3. Manual: Copy ser-app/dist/ to your web server"
echo "  4. Heroku: Configure secrets in GitHub and push"
echo ""
echo "📖 See README.md for detailed instructions"