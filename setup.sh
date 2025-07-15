#!/bin/bash

# Setup script for Calculus Detection AI Integration

echo "🦷 Setting up Calculus Detection AI Integration..."
echo "================================================="

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python found: $(python --version)"

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip found: $(pip --version)"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully!"
else
    echo "❌ Failed to install Python dependencies."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Node.js dependencies installed successfully!"
else
    echo "❌ Failed to install Node.js dependencies."
    exit 1
fi

# Check if model files exist
echo "🔍 Checking for model files..."

if [ ! -f "../segmentyolo.pt" ]; then
    echo "⚠️  Warning: segmentyolo.pt not found in parent directory"
    echo "   Please ensure the YOLO model file is available"
fi

if [ ! -f "../best_model.pth" ]; then
    echo "⚠️  Warning: best_model.pth not found in parent directory"
    echo "   Please ensure the U-Net model file is available"
fi

if [ ! -f "../default.yaml" ]; then
    echo "⚠️  Warning: default.yaml not found in parent directory"
    echo "   Please ensure the configuration file is available"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To start in development mode:"
echo "  npm run dev"
echo ""
echo "The AI detection will be available at: http://localhost:3000/detect"
