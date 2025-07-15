# Calculus Detection Web Server

A Node.js/Express web server for the calculusdetection.com domain providing AI-powered calculus detection and annotation capabilities.

## Features

### Three Main Subdomains

1. **`/detect`** - AI Model Detection
   - Upload images for calculus detection using YOLO + U-Net AI models
   - Real-time processing with tooth segmentation and calculus analysis
   - Interactive results with percentage coverage and severity indicators
   - Side-by-side comparison of original and processed images

2. **`/test`** - User-Based Testing System
   - User selection (User 1-100)
   - 20 images per user for annotation
   - Progress tracking and completion status

3. **`/annotate`** - Direct Annotation
   - Open annotation system without user registration
   - Paintbrush tool for image annotation
   - Mask saving and overlay functionality

4. **`/view`** - Admin Dashboard
   - Admin login required (username: admin, password: admin123)
   - View all annotations from both test and annotate sections
   - Track user activity and annotation statistics
   - Accessible via Admin Login button on homepage

## Technology Stack

- **Backend**: Node.js with Express
- **AI Models**: YOLO (tooth detection) + U-Net (calculus segmentation)
- **Python Integration**: AI processing via child processes
- **Frontend**: HTML5, CSS3, JavaScript
- **Canvas API**: For paintbrush annotation tool
- **File Upload**: Multer for secure image handling
- **Storage**: Local file system (images and annotations)
- **Security**: Helmet for security headers

## Quick Start Guide

**🚀 For complete setup instructions, see [SETUP.md](SETUP.md)**

### Windows Users (Easiest Method)
1. Double-click `start-server.bat` 
2. Open browser to `http://localhost:3000`

### Manual Setup (All Platforms)

### Prerequisites
- Node.js (version 14 or higher)
- Python 3.8+ with pip
- AI model files: `segmentyolo.pt` and `best_model.pth` (from parent directory)

### Quick AI Setup
1. **Run the setup script**:
   ```bash
   # Windows
   setup.bat
   
   # Linux/Mac
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access the application**:
   - Open browser to `http://localhost:3000`
   - Navigate to `/detect` for AI-powered calculus detection

### Manual Installation
- npm (comes with Node.js)

### Step-by-Step Setup

1. **Download/Clone the project**
   ```bash
   # If you have git installed:
   git clone <repository-url>
   cd Calculus
   
   # Or simply download and extract the project folder
   ```

2. **Navigate to the project directory**
   ```bash
   cd "C:\Users\Bitroix\Desktop\Technion\Calculus"
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   Create a `.env` file in the root directory:
   ```
   PORT=3000
   NODE_ENV=development
   ```

5. **Organize your images**
   ```bash
   # Run the setup script to organize images
   node setup-images.js
   ```
   
   **Manual image organization:**
   - Put images for the **test section** in: `uploads/test-images/`
   - Put images for the **annotate section** in: `uploads/annotate-images/`

6. **Start the server**
   ```bash
   # For development (auto-restarts on file changes)
   npm run dev
   
   # OR for production
   npm start
   ```

7. **Access the application**
   Open your browser and go to: `http://localhost:3000`

### Image Organization

The project uses separate folders for different sections:

- **`uploads/test-images/`** - Images for the test section (user-based annotation)
- **`uploads/annotate-images/`** - Images for the general annotation section
- **`uploads/annotations/`** - Saved annotation masks (auto-created)

### Running Commands

All commands should be run from the project root directory:
```bash
C:\Users\Bitroix\Desktop\Technion\Calculus
```

**Available commands:**
- `npm install` - Install all dependencies
- `npm start` - Start production server
- `npm run dev` - Start development server (with auto-reload)
- `node setup-images.js` - Organize images into proper folders

## Development

Start the development server:
```bash
npm run dev
```

Start the production server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Project Structure

```
├── server.js              # Main server file
├── views/                 # HTML templates
│   ├── index.html         # Landing page
│   ├── detect.html        # AI detection page
│   ├── test.html          # User selection page
│   ├── test-annotation.html # Test annotation interface
│   ├── annotate.html      # Direct annotation page
│   └── 404.html           # Error page
├── public/                # Static assets
│   ├── css/               # Stylesheets
│   │   ├── style.css      # Main styles
│   │   └── annotation.css # Annotation-specific styles
│   ├── js/                # JavaScript files
│   │   ├── detect.js      # Detection page logic
│   │   ├── test.js        # Test page logic
│   │   ├── annotation.js  # Annotation tool (shared)
│   │   ├── test-annotation.js # Test annotation logic
│   │   └── direct-annotation.js # Direct annotation logic
│   └── sample-images/     # Sample images for annotation
├── uploads/               # File uploads
│   ├── test-images/       # Images for test section
│   ├── annotate-images/   # Images for annotate section
│   └── annotations/       # Saved annotations
└── .github/
    └── copilot-instructions.md # AI assistant instructions
```

## API Endpoints

### Detection
- `POST /detect` - Upload image for AI detection

### Test System
- `GET /api/test/images/:userId` - Get images for specific user
- `POST /api/annotations/:imageId` - Save annotation with user ID

### Direct Annotation
- `GET /api/annotate/images` - Get all unannotated images
- `POST /api/annotations/:imageId` - Save annotation
- `GET /api/annotations/:imageId` - Get existing annotations

### Admin
- `POST /admin/login` - Admin login
- `GET /view` - Admin dashboard (requires authentication)
- `GET /api/admin/annotations` - Get all annotations with metadata

## Features

### Annotation Tool
- **Paintbrush**: Variable size brush for precise annotation
- **Real-time Preview**: Live brush size indicator
- **Canvas Layers**: Separate image and annotation layers
- **Touch Support**: Mobile-friendly touch controls
- **Keyboard Shortcuts**: Esc to close, Ctrl+Enter to save

### Security Features
- File type validation (images only)
- File size limits (10MB)
- Helmet security headers
- CORS protection
- Input sanitization

### User Experience
- Responsive design for all devices
- Drag-and-drop file upload
- Progress tracking
- Completion status
- Error handling and validation

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2
3. Set up a reverse proxy (nginx)
4. Configure SSL certificates
5. Set up proper file permissions

## GoDaddy Hosting

To deploy on GoDaddy:

1. Upload files to your hosting directory
2. Install Node.js dependencies
3. Configure your domain to point to the server
4. Set up subdomain routing in your hosting control panel
5. Start the Node.js application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see LICENSE file for details

## Support

For issues and questions, please refer to the documentation or create an issue in the repository.

## AI Model Integration

### Overview
The `/detect` endpoint now includes full AI model integration using the YOLO + U-Net pipeline from the main project.

### AI Processing Pipeline
1. **YOLO Detection**: Identifies and segments individual teeth
2. **U-Net Segmentation**: Analyzes each tooth for calculus presence
3. **Visualization**: Creates overlays with calculus highlighted in red
4. **Analysis**: Calculates percentage coverage and severity levels

### Detection Results
- **Teeth Detected**: Total number of teeth found in the image
- **Average Coverage**: Overall calculus coverage percentage
- **Individual Analysis**: Per-tooth calculus percentage and severity
- **Visual Overlay**: Processed image with calculus regions highlighted

### Severity Levels
- **Low (Green)**: 0-10% calculus coverage
- **Medium (Yellow)**: 10-20% calculus coverage
- **High (Red)**: >20% calculus coverage

### Model Requirements
- **YOLO Model**: `segmentyolo.pt` (tooth detection)
- **U-Net Model**: `best_model.pth` (calculus segmentation)
- **Configuration**: `default.yaml` (model paths and settings)

### Python Dependencies
The AI integration requires several Python packages:
- PyTorch
- OpenCV
- Ultralytics (YOLO)
- Segmentation Models PyTorch
- NumPy, Pillow, PyYAML

### Performance
- GPU acceleration supported (falls back to CPU)
- Processing time: 2-5 seconds per image
- Memory usage: ~2GB GPU memory recommended

For detailed AI integration documentation, see [AI_INTEGRATION.md](AI_INTEGRATION.md)
