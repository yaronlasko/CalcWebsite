# Complete Setup Guide - From Zero to Running

## Method 1: Quick Start (Windows)

1. **Double-click** `start-server.bat` in the project folder
2. The script will automatically:
   - Check if Node.js is installed
   - Install dependencies
   - Set up image folders
   - Start the server
3. Open your browser to `http://localhost:3000`

## Method 2: Manual Setup

### Prerequisites
- **Node.js** (version 14 or higher) - Download from [nodejs.org](https://nodejs.org/)
- **Command Prompt** or **PowerShell**

### Step-by-Step Instructions

1. **Open Command Prompt or PowerShell**
   - Press `Win + R`, type `cmd`, press Enter
   - Or press `Win + X`, select "Windows PowerShell"

2. **Navigate to the project folder**
   ```bash
   cd "C:\Users\Bitroix\Desktop\Technion\Calculus"
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```
   
4. **Set up image folders**
   ```bash
   node setup-images.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Go to: `http://localhost:3000`

## Image Organization

After running the setup, your images will be organized as follows:

### Test Section Images
- **Location**: `uploads/test-images/`
- **Purpose**: Used for user-based testing (when users select User 1, User 2, etc.)
- **Current count**: 33 images (from your uploads/images folder)

### Annotate Section Images
- **Location**: `uploads/annotate-images/`
- **Purpose**: Used for general annotation (no user selection required)
- **Current count**: 0 images (empty - add your images here)

### To Add Images for Annotation Section:
1. Copy any images you want for the annotate section to: `uploads/annotate-images/`
2. Restart the server: `npm start`

## Available URLs

Once the server is running:

- **Main Page**: `http://localhost:3000`
- **AI Detection**: `http://localhost:3000/detect`
- **Test Section**: `http://localhost:3000/test`
- **Annotation Section**: `http://localhost:3000/annotate`

## Troubleshooting

### "Node.js is not installed"
- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your command prompt after installation

### "Cannot find module" errors
- Run: `npm install`
- If that fails, delete `node_modules` folder and run `npm install` again

### "Port 3000 is already in use"
- Close any existing server instances
- Or change the port in `.env` file: `PORT=3001`

### Images not showing
- Check that images are in the correct folders:
  - `uploads/test-images/` for test section
  - `uploads/annotate-images/` for annotate section
- Restart the server after adding images

## Development Mode

For development with auto-reload:
```bash
npm run dev
```

## Stopping the Server

- Press `Ctrl + C` in the command prompt
- Or close the command prompt window

## Next Steps

1. **Add annotation images**: Copy images to `uploads/annotate-images/`
2. **Test the system**: Try each section (detect, test, annotate)
3. **Deploy to production**: Follow the deployment guide when ready

## File Structure Summary

```
Calculus/
├── start-server.bat      # Windows quick start script
├── setup-images.js      # Image organization script
├── server.js            # Main server file
├── package.json         # Dependencies
├── .env                 # Environment variables
├── uploads/
│   ├── test-images/     # Images for test section (33 images)
│   ├── annotate-images/ # Images for annotate section (add yours here)
│   └── annotations/     # Saved annotations (auto-created)
└── views/               # HTML pages
    └── public/          # CSS, JS, static files
```
