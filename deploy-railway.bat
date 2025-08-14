@echo off
REM Fast deployment script for Railway (Windows)

echo 🚀 Fast Deployment to Railway
echo ==============================

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    git add .
    git commit -m "Initial commit for deployment"
)

REM Check if railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Railway CLI...
    npm install -g @railway/cli
)

REM Deploy to Railway
echo Deploying to Railway...
railway login
railway init
railway up

echo ✅ Deployment complete!
echo 🌐 Your app should be live at your Railway URL
echo 🔗 Check your Railway dashboard for the URL
pause
