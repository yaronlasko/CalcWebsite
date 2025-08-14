#!/bin/bash
# Fast deployment script for Railway

echo "🚀 Fast Deployment to Railway"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
fi

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Deploy to Railway
echo "Deploying to Railway..."
railway login
railway init
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at your Railway URL"
echo "🔗 Check your Railway dashboard for the URL"
