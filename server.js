const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Express session for admin authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'calculus-detection-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Admin credentials (in production, use environment variables or database)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Configuration constants
const MAX_USER_ID = parseInt(process.env.MAX_USER_ID) || 100;

// Load user passwords from CSV file
let USER_PASSWORDS = {};

function loadUserPasswords() {
    try {
        const csvPath = path.join(__dirname, 'user_passwords.csv');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n');
        
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const [userId, password] = line.split(',');
                if (userId && password) {
                    USER_PASSWORDS[parseInt(userId)] = password;
                }
            }
        }
        
        console.log(`Loaded ${Object.keys(USER_PASSWORDS).length} user passwords from CSV`);
    } catch (error) {
        console.error('Error loading user passwords:', error);
        process.exit(1);
    }
}

// Load passwords on startup
loadUserPasswords();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
        },
    },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create necessary directories
const dirs = ['uploads', 'uploads/images', 'uploads/test-images', 'uploads/annotate-images', 'uploads/annotations', 'public/css', 'public/js'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Sample images data (in production, this would be in a database)
let testImages = [];
let annotateImages = [];
let annotations = {};

// Initialize with actual images from uploads directory
function initializeImages() {
    // Custom sorting function to sort numerically when possible
    function numericSort(a, b) {
        // Extract the base filename without extension
        const aName = a.replace(/\.[^/.]+$/, '');
        const bName = b.replace(/\.[^/.]+$/, '');
        
        // Check if both are valid numbers
        const aNum = parseFloat(aName);
        const bNum = parseFloat(bName);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            // Both are numbers, sort numerically
            return aNum - bNum;
        } else if (!isNaN(aNum)) {
            // Only a is a number, a comes first
            return -1;
        } else if (!isNaN(bNum)) {
            // Only b is a number, b comes first
            return 1;
        } else {
            // Neither are numbers, sort alphabetically
            return a.localeCompare(b);
        }
    }
    
    // Load test images
    const testImagesDir = path.join(__dirname, 'uploads', 'test-images');
    if (fs.existsSync(testImagesDir)) {
        const testImageFiles = fs.readdirSync(testImagesDir)
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .sort(numericSort);
        
        testImageFiles.forEach((file, index) => {
            testImages.push({
                id: `test-${index + 1}`,
                name: file,
                path: `/uploads/test-images/${file}`,
                annotated: false,
                completedBy: []
            });
        });
    }
    
    // Load annotate images
    const annotateImagesDir = path.join(__dirname, 'uploads', 'annotate-images');
    if (fs.existsSync(annotateImagesDir)) {
        const annotateImageFiles = fs.readdirSync(annotateImagesDir)
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .sort(numericSort);
        
        annotateImageFiles.forEach((file, index) => {
            annotateImages.push({
                id: `annotate-${index + 1}`,
                name: file,
                path: `/uploads/annotate-images/${file}`,
                annotated: false,
                completedBy: []
            });
        });
    }
    
    console.log(`Loaded ${testImages.length} test images and ${annotateImages.length} annotate images`);
}

initializeImages();

// Routes

// Main domain - Landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Detect subdomain - AI model placeholder
app.get('/detect', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'detect.html'));
});

app.post('/detect', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }
    
    try {
        // Run the Python AI model
        const imagePath = req.file.path;
        const result = await runAIModel(imagePath);
        
        if (result.success) {
            // Return the detection results
            const processedImagePath = result.processed_image_path;
            // Convert the processed image path to a URL
            const processedImageUrl = processedImagePath.replace(/\\/g, '/');
            
            res.json({
                success: true,
                message: 'Calculus detection completed successfully',
                filename: req.file.filename,
                results: {
                    teeth_detected: result.teeth_detected,
                    average_calculus_coverage: result.average_calculus_coverage,
                    individual_results: result.individual_results,
                    processed_image_url: `/${processedImageUrl}`,
                    original_image_url: `/uploads/images/${req.file.filename}`
                }
            });
        } else {
            res.status(500).json({ 
                error: 'AI model processing failed', 
                details: result.error 
            });
        }
    } catch (error) {
        console.error('Error in detection:', error);
        res.status(500).json({ 
            error: 'Internal server error during detection',
            details: error.message 
        });
    }
});

// Function to run the Python AI model
function runAIModel(imagePath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['ai_model.py', imagePath], {
            cwd: __dirname
        });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error(`Failed to parse AI model output: ${parseError.message}`));
                }
            } else {
                reject(new Error(`Python process exited with code ${code}. Error: ${errorOutput}`));
            }
        });
        
        pythonProcess.on('error', (error) => {
            reject(new Error(`Failed to start Python process: ${error.message}`));
        });
    });
}

// Test subdomain - User selection and annotation
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'test.html'));
});

app.get('/test/user/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Validate user ID
    if (!userId || isNaN(userId) || userId < 1 || userId > MAX_USER_ID) {
        return res.redirect('/test?error=invalid_user_id');
    }
    
    // Check if user is authenticated (optional - for extra security)
    // For now, we'll allow direct access since password validation happens at login
    res.sendFile(path.join(__dirname, 'views', 'test-annotation.html'));
});

app.get('/api/config', (req, res) => {
    res.json({
        maxUserId: MAX_USER_ID
    });
});

// Password validation endpoint
app.post('/api/test/validate', (req, res) => {
    const { userId, password } = req.body;
    
    // Validate user ID
    if (!userId || isNaN(userId) || userId < 1 || userId > MAX_USER_ID) {
        return res.status(400).json({ 
            success: false, 
            error: `User ID must be between 1 and ${MAX_USER_ID}` 
        });
    }
    
    // Validate password
    if (!password || typeof password !== 'string' || password.length !== 4) {
        return res.status(400).json({ 
            success: false, 
            error: 'Password must be a 4-digit string' 
        });
    }
    
    // Check if password matches
    const expectedPassword = USER_PASSWORDS[userId];
    if (password === expectedPassword) {
        // Store user authentication in session
        req.session.authenticatedUser = userId;
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Invalid credentials' });
    }
});

app.get('/api/test/images/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Validate user ID
    if (!userId || isNaN(userId) || userId < 1 || userId > MAX_USER_ID) {
        return res.status(400).json({ error: `User ID must be between 1 and ${MAX_USER_ID}` });
    }
    
    const userImages = testImages.filter(img => !img.completedBy.includes(userId));
    res.json(userImages.slice(0, 20));
});

// Annotate subdomain - Direct annotation
app.get('/annotate', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'annotate.html'));
});

app.get('/api/annotate/images', (req, res) => {
    const unannotatedImages = annotateImages.filter(img => !img.annotated);
    res.json(unannotatedImages);
});

// API endpoints for annotations
app.post('/api/annotations/:imageId', (req, res) => {
    const { imageId } = req.params;
    const { maskData, userId } = req.body;
    
    if (!maskData) {
        return res.status(400).json({ error: 'Mask data is required' });
    }
    
    try {
        // Save annotation
        const annotationPath = path.join(__dirname, 'uploads', 'annotations', `${imageId}-${Date.now()}.png`);
        
        // Convert base64 to image file
        const base64Data = maskData.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(annotationPath, base64Data, 'base64');
        
        // Update image data
        let imageIndex = -1;
        let imageArray = null;
        
        if (imageId.startsWith('test-')) {
            imageIndex = testImages.findIndex(img => img.id === imageId);
            imageArray = testImages;
        } else if (imageId.startsWith('annotate-')) {
            imageIndex = annotateImages.findIndex(img => img.id === imageId);
            imageArray = annotateImages;
        }
        
        if (imageIndex !== -1 && imageArray) {
            if (userId) {
                if (!imageArray[imageIndex].completedBy.includes(userId)) {
                    imageArray[imageIndex].completedBy.push(userId);
                }
            } else {
                imageArray[imageIndex].annotated = true;
            }
        }
        
        // Function to get original image name
        function getOriginalImageName(imageId) {
            if (imageId.startsWith('test-')) {
                const img = testImages.find(img => img.id === imageId);
                return img ? img.name : '';
            } else if (imageId.startsWith('annotate-')) {
                const img = annotateImages.find(img => img.id === imageId);
                return img ? img.name : '';
            }
            return '';
        }
        
        // Store annotation metadata
        const annotationData = {
            imageId: imageId,
            userId: userId || 'anonymous',
            timestamp: new Date().toISOString(),
            filename: path.basename(annotationPath),
            source: imageId.startsWith('test-') ? 'test' : 'annotate',
            originalImage: getOriginalImageName(imageId)
        };
        
        // Save annotation metadata
        const metadataPath = path.join(__dirname, 'uploads', 'annotations', `${imageId}-${Date.now()}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(annotationData, null, 2));
        
        res.json({ 
            message: 'Annotation saved successfully',
            annotationPath: annotationPath,
            metadata: annotationData
        });
    } catch (error) {
        console.error('Error saving annotation:', error);
        res.status(500).json({ error: 'Failed to save annotation: ' + error.message });
    }
});

app.get('/api/annotations/:imageId', (req, res) => {
    const { imageId } = req.params;
    const annotationDir = path.join(__dirname, 'uploads', 'annotations');
    
    if (!fs.existsSync(annotationDir)) {
        return res.json([]);
    }
    
    const files = fs.readdirSync(annotationDir)
        .filter(file => file.startsWith(`${imageId}-`))
        .map(file => ({
            filename: file,
            path: `/uploads/annotations/${file}`
        }));
    
    res.json(files);
});

// Admin routes
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Invalid credentials' });
    }
});

// Admin middleware
function requireAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/');
    }
}

app.get('/view', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/api/admin/annotations', requireAdmin, (req, res) => {
    const annotationDir = path.join(__dirname, 'uploads', 'annotations');
    
    if (!fs.existsSync(annotationDir)) {
        return res.json({ test: [], annotate: [] });
    }
    
    const files = fs.readdirSync(annotationDir);
    const annotations = { test: [], annotate: [] };
    
    files.forEach(file => {
        if (file.endsWith('.json')) {
            try {
                const filePath = path.join(annotationDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.source === 'test') {
                    annotations.test.push(data);
                } else if (data.source === 'annotate') {
                    annotations.annotate.push(data);
                }
            } catch (error) {
                console.error('Error reading annotation file:', file, error);
            }
        }
    });
    
    // Sort by timestamp (newest first)
    annotations.test.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    annotations.annotate.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(annotations);
});

// Admin endpoint to get all test images
app.get('/api/admin/test-images', requireAdmin, (req, res) => {
    res.json(testImages);
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
    }
    
    console.error(error);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});

module.exports = app;
