@echo off
echo 🦷 Setting up Calculus Detection AI Integration...
echo =================================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

echo ✅ Python found
python --version

REM Check if pip is installed
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pip is not installed. Please install pip first.
    pause
    exit /b 1
)

echo ✅ pip found
pip --version

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies.
    pause
    exit /b 1
)

echo ✅ Python dependencies installed successfully!

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install Node.js dependencies.
    pause
    exit /b 1
)

echo ✅ Node.js dependencies installed successfully!

REM Check if model files exist
echo 🔍 Checking for model files...

if not exist "..\segmentyolo.pt" (
    echo ❌ ERROR: segmentyolo.pt not found in parent directory
    echo    Please download and place the YOLO model file in the project root
    echo    Expected location: ..\segmentyolo.pt
    echo.
    set /p dummy=Press Enter to continue anyway...
) else (
    echo ✅ segmentyolo.pt found
)

if not exist "..\best_model.pth" (
    echo ❌ ERROR: best_model.pth not found in parent directory
    echo    Please download from: https://drive.google.com/file/d/1H9YKaYMzEsLSEydyk2XK3GSnE6B1rWUJ/view?usp=sharing
    echo    Expected location: ..\best_model.pth
    echo.
    set /p dummy=Press Enter to continue anyway...
) else (
    echo ✅ best_model.pth found
)

if not exist "..\default.yaml" (
    echo ❌ ERROR: default.yaml not found in parent directory
    echo    Please ensure the configuration file is available
    echo    Expected location: ..\default.yaml
    echo.
    set /p dummy=Press Enter to continue anyway...
) else (
    echo ✅ default.yaml found
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Creating .env file from template...
        copy ".env.example" ".env"
        echo ✅ .env file created
    )
)

echo.
echo 🎉 Setup complete!
echo.
echo 📖 For detailed setup instructions, see: SETUP_GUIDE.md
echo.
echo 🚀 To start the server:
echo   .\start-server.bat
echo   OR
echo   npm start
echo.
echo 🔧 To start in development mode:
echo   npm run dev
echo.
echo 🌐 The application will be available at:
echo   http://localhost:3000
echo   http://localhost:3000/detect (AI Detection)
echo   http://localhost:3000/test (Test Interface)
echo   http://localhost:3000/annotate (Annotation Tool)
echo.
pause
