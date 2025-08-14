const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { spawn } = require('child_process');
const AnnotationDatabase = require('./database/annotation-db');
require('dotenv').config();

// Initialize database
const annotationDB = new AnnotationDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Express session for admin authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'calculus-detection-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to false for now to work with Render proxy
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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
app.post('/api/annotations/:imageId', async (req, res) => {
    const { imageId } = req.params;
    const { maskData, userId } = req.body;
    
    if (!maskData) {
        return res.status(400).json({ error: 'Mask data is required' });
    }
    
    try {
        // Save annotation file (still save the actual image file)
        const annotationPath = path.join(__dirname, 'uploads', 'annotations', `${imageId}-${Date.now()}.png`);
        const base64Data = maskData.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(annotationPath, base64Data, 'base64');
        
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
        
        // Prepare annotation data for database
        const annotationData = {
            imageId: imageId,
            userId: userId || 'anonymous',
            source: imageId.startsWith('test-') ? 'test' : 'annotate',
            originalImage: getOriginalImageName(imageId),
            maskData: base64Data, // Store base64 data in database
            maskFilename: path.basename(annotationPath)
        };
        
        // Save to database
        const dbResult = await annotationDB.saveAnnotation(annotationData);
        
        // Update image data (keep existing functionality)
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
        
        res.json({ 
            message: 'Annotation saved successfully to database',
            annotationPath: annotationPath,
            databaseId: dbResult.id,
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
    console.log('Admin login attempt:', { username, providedPassword: password ? '***' : 'empty' });
    console.log('Expected credentials:', { expectedUsername: ADMIN_USERNAME, expectedPassword: ADMIN_PASSWORD ? '***' : 'empty' });
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        console.log('✅ Admin login successful');
        res.json({ success: true });
    } else {
        console.log('❌ Admin login failed - invalid credentials');
        res.json({ success: false, error: 'Invalid credentials' });
    }
});

// Admin middleware
function requireAdmin(req, res, next) {
    console.log('Admin middleware check:', { 
        isAdmin: req.session.isAdmin, 
        sessionId: req.session.id,
        hasSession: !!req.session 
    });
    
    if (req.session.isAdmin) {
        next();
    } else {
        console.log('❌ Admin access denied - redirecting to home');
        res.redirect('/');
    }
}

app.get('/view', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Debug endpoint to check admin status
app.get('/api/admin/status', (req, res) => {
    res.json({
        isAdmin: !!req.session.isAdmin,
        sessionId: req.session.id || 'no-session',
        hasSession: !!req.session,
        adminUsername: ADMIN_USERNAME,
        nodeEnv: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/admin/annotations', requireAdmin, async (req, res) => {
    try {
        // Get all annotations from database
        const allAnnotations = await annotationDB.getAllAnnotations();
        
        // Group by source
        const annotations = { 
            test: [], 
            annotate: [],
            annotations: allAnnotations // For monitoring tools
        };
        
        allAnnotations.forEach(annotation => {
            // Convert database format to expected format
            const formattedAnnotation = {
                id: annotation.id,
                imageId: annotation.image_id,
                userId: annotation.user_id,
                timestamp: annotation.timestamp,
                source: annotation.source,
                originalImage: annotation.original_image,
                filename: annotation.mask_filename,
                path: `/uploads/annotations/${annotation.mask_filename}`
            };
            
            if (annotation.source === 'test') {
                annotations.test.push(formattedAnnotation);
            } else if (annotation.source === 'annotate') {
                annotations.annotate.push(formattedAnnotation);
            }
        });
        
        // Sort by timestamp (newest first)
        annotations.test.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        annotations.annotate.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(annotations);
    } catch (error) {
        console.error('Error fetching annotations from database:', error);
        res.status(500).json({ error: 'Failed to fetch annotations: ' + error.message });
    }
});

// Admin endpoint to get all test images
app.get('/api/admin/test-images', requireAdmin, (req, res) => {
    res.json(testImages);
});

// New database-powered admin endpoints
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await annotationDB.getAnnotationStats();
        const userStats = await annotationDB.getUserStats();
        
        res.json({
            overview: stats,
            topUsers: userStats.slice(0, 10)
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats: ' + error.message });
    }
});

app.get('/api/admin/users/:userId/annotations', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const annotations = await annotationDB.getAnnotationsByUser(userId);
        
        res.json({
            userId,
            annotations: annotations.map(a => ({
                id: a.id,
                imageId: a.image_id,
                timestamp: a.timestamp,
                source: a.source,
                originalImage: a.original_image
            }))
        });
    } catch (error) {
        console.error('Error fetching user annotations:', error);
        res.status(500).json({ error: 'Failed to fetch user annotations: ' + error.message });
    }
});

app.get('/api/admin/export', requireAdmin, async (req, res) => {
    try {
        const annotations = await annotationDB.exportAnnotations();
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="annotations-export-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(annotations);
    } catch (error) {
        console.error('Error exporting annotations:', error);
        res.status(500).json({ error: 'Failed to export annotations: ' + error.message });
    }
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
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
    console.log(`✅ Database initialized and ready`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    annotationDB.close();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    annotationDB.close();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = app;
