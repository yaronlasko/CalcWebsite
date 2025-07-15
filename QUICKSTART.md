# 🚀 Quick Start Guide

## ⚡ Quick Setup (For New Machines)

### 1. Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### 2. Setup Commands
```bash
# Clone the repository
git clone [your-repository-url]
cd CalculusSegmenation

# Download model files and place in project root:
# - segmentyolo.pt
# - best_model.pth (from: https://drive.google.com/file/d/1H9YKaYMzEsLSEydyk2XK3GSnE6B1rWUJ/view?usp=sharing)

# Run setup
cd Calculus
.\setup.bat        # Windows
# or
./setup.sh         # Linux/Mac

# Start the server
.\start-server.bat  # Windows
# or
npm start          # Any platform
```

### 3. Access the Application
- Main: http://localhost:3000
- AI Detection: http://localhost:3000/detect
- Test Interface: http://localhost:3000/test
- Annotation: http://localhost:3000/annotate

## 📖 Full Documentation
See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions and troubleshooting.

## ❗ Common Issues
- **Model files missing**: Download from the provided links
- **Python/Node not found**: Install and add to PATH
- **Dependencies fail**: Try clearing cache and reinstalling
- **Port 3000 in use**: Kill existing process or change port in .env
