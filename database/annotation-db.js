const fs = require('fs');
const path = require('path');
const GoogleDriveStorage = require('./google-drive-storage');

class AnnotationDatabase {
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        this.annotationsFile = path.join(dataDir, 'annotations.json');
        this.usersFile = path.join(dataDir, 'users.json');
        this.imagesFile = path.join(dataDir, 'images.json');
        
        // Initialize Google Drive storage
        this.driveStorage = new GoogleDriveStorage();
        
        this.init();
    }

    async init() {
        try {
            // Create data directory if it doesn't exist
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }

            // Try to restore data from Google Drive first
            console.log('🔄 Attempting to restore data from Google Drive...');
            const remoteData = await this.driveStorage.restoreAll();
            
            if (remoteData.annotations.length > 0 || Object.keys(remoteData.users).length > 0) {
                // Restore from Google Drive
                this.writeJSONFile(this.annotationsFile, remoteData.annotations);
                this.writeJSONFile(this.usersFile, remoteData.users);
                this.writeJSONFile(this.imagesFile, remoteData.images);
                console.log('✅ Data restored from Google Drive');
                console.log(`📊 Restored: ${remoteData.annotations.length} annotations, ${Object.keys(remoteData.users).length} users`);
            } else {
                // Initialize with empty data
                this.initializeFile(this.annotationsFile, []);
                this.initializeFile(this.usersFile, {});
                this.initializeFile(this.imagesFile, {});
                console.log('📁 No remote data found - initialized with empty data');
            }
            
            console.log('✅ Connected to JSON file database with Google Drive backup');
        } catch (err) {
            console.error('Error initializing database:', err);
            // Fallback to local initialization
            this.initializeFile(this.annotationsFile, []);
            this.initializeFile(this.usersFile, {});
            this.initializeFile(this.imagesFile, {});
            console.log('⚠️  Initialized with local storage only');
        }
    }

    initializeFile(filePath, defaultData) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    readJSONFile(filePath, defaultData) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Error reading ${filePath}:`, err);
            return defaultData;
        }
    }

    writeJSONFile(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(`Error writing ${filePath}:`, err);
            throw err;
        }
    }

    saveAnnotation(annotationData) {
        const {
            imageId,
            userId,
            source,
            originalImage,
            annotationData: data,
            maskFilename
        } = annotationData;

        try {
            // Read current annotations
            const annotations = this.readJSONFile(this.annotationsFile, []);
            
            // Create new annotation
            const newAnnotation = {
                id: Date.now() + Math.random(),
                image_id: imageId,
                user_id: userId,
                timestamp: new Date().toISOString(),
                source: source,
                original_image: originalImage,
                annotation_data: JSON.stringify(data),
                mask_filename: maskFilename,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Add to annotations
            annotations.push(newAnnotation);
            this.writeJSONFile(this.annotationsFile, annotations);
            
            // Update user stats
            this.updateUserStats(userId);
            
            // Update image stats
            this.updateImageStats(imageId);
            
            console.log(`✅ Annotation saved with ID: ${newAnnotation.id}`);
            
            // Immediate backup to Google Drive (synchronous)
            this.backupToGoogleDrive()
                .then(() => {
                    console.log('☁️  Annotation automatically backed up to Google Drive');
                })
                .catch(err => {
                    console.error('⚠️  Google Drive auto-backup failed:', err.message);
                });
            
            return newAnnotation.id;
        } catch (err) {
            console.error('Error saving annotation:', err);
            throw err;
        }
    }

    async backupToGoogleDrive() {
        try {
            const annotations = this.readJSONFile(this.annotationsFile, []);
            const users = this.readJSONFile(this.usersFile, {});
            const images = this.readJSONFile(this.imagesFile, {});
            
            console.log(`🔄 Backing up to Google Drive: ${annotations.length} annotations, ${Object.keys(users).length} users, ${Object.keys(images).length} images`);
            
            await this.driveStorage.backupAll(annotations, users, images);
            console.log('☁️  Data backed up to Google Drive successfully');
            return true;
        } catch (error) {
            console.error('❌ Google Drive backup error:', error.message);
            return false;
        }
    }

    // Create a test annotation to verify backup is working
    async createTestAnnotation() {
        if (!this.driveStorage || !this.driveStorage.isInitialized) {
            console.log('⚠️  Cannot create test - Google Drive not initialized');
            return false;
        }

        const testAnnotation = {
            imageId: 'test-image-1',
            userId: 999,
            source: 'test',
            originalImage: 'test-verification.jpg',
            annotationData: { test: true, created: new Date().toISOString() },
            maskFilename: 'test-mask.png'
        };

        try {
            const id = this.saveAnnotation(testAnnotation);
            console.log('✅ Test annotation created with ID:', id);
            return true;
        } catch (error) {
            console.error('❌ Error creating test annotation:', error);
            return false;
        }
    }

    updateUserStats(userId) {
        try {
            const users = this.readJSONFile(this.usersFile, {});
            const now = new Date().toISOString();
            
            if (!users[userId]) {
                users[userId] = {
                    user_id: userId,
                    first_annotation: now,
                    last_annotation: now,
                    total_annotations: 1,
                    created_at: now
                };
            } else {
                users[userId].last_annotation = now;
                users[userId].total_annotations = (users[userId].total_annotations || 0) + 1;
            }
            
            this.writeJSONFile(this.usersFile, users);
            console.log(`📊 Updated stats for user ${userId}: ${users[userId].total_annotations} total annotations`);
        } catch (err) {
            console.error('Error updating user stats:', err);
        }
    }

    updateImageStats(imageId) {
        try {
            const images = this.readJSONFile(this.imagesFile, {});
            
            if (!images[imageId]) {
                images[imageId] = {
                    image_id: imageId,
                    filename: imageId,
                    source: 'unknown',
                    annotation_count: 1,
                    created_at: new Date().toISOString()
                };
            } else {
                images[imageId].annotation_count = (images[imageId].annotation_count || 0) + 1;
            }
            
            this.writeJSONFile(this.imagesFile, images);
            console.log(`📊 Updated stats for image ${imageId}: ${images[imageId].annotation_count} annotations`);
        } catch (err) {
            console.error('Error updating image stats:', err);
        }
    }

    getAllAnnotations(limit = 100) {
        try {
            const annotations = this.readJSONFile(this.annotationsFile, []);
            return annotations
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);
        } catch (err) {
            console.error('Error getting annotations:', err);
            return [];
        }
    }

    getAnnotationsByUser(userId) {
        try {
            const annotations = this.readJSONFile(this.annotationsFile, []);
            return annotations
                .filter(a => a.user_id === userId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (err) {
            console.error('Error getting user annotations:', err);
            return [];
        }
    }

    getAnnotationsByImage(imageId) {
        try {
            const annotations = this.readJSONFile(this.annotationsFile, []);
            return annotations
                .filter(a => a.image_id === imageId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (err) {
            console.error('Error getting image annotations:', err);
            return [];
        }
    }

    getAnnotationStats() {
        try {
            const annotations = this.readJSONFile(this.annotationsFile, []);
            const uniqueUsers = new Set(annotations.map(a => a.user_id));
            const uniqueImages = new Set(annotations.map(a => a.image_id));
            
            return {
                total_annotations: annotations.length,
                unique_users: uniqueUsers.size,
                annotated_images: uniqueImages.size,
                test_annotations: annotations.filter(a => a.source === 'test').length,
                direct_annotations: annotations.filter(a => a.source === 'annotate').length
            };
        } catch (err) {
            console.error('Error getting stats:', err);
            return {};
        }
    }

    getUserStats() {
        try {
            const users = this.readJSONFile(this.usersFile, {});
            return Object.values(users)
                .sort((a, b) => (b.total_annotations || 0) - (a.total_annotations || 0));
        } catch (err) {
            console.error('Error getting user stats:', err);
            return [];
        }
    }

    exportAnnotations() {
        try {
            const annotations = this.readJSONFile(this.annotationsFile, []);
            const users = this.readJSONFile(this.usersFile, {});
            const images = this.readJSONFile(this.imagesFile, {});
            
            return annotations.map(annotation => ({
                ...annotation,
                user_total_annotations: users[annotation.user_id]?.total_annotations || 0,
                image_total_annotations: images[annotation.image_id]?.annotation_count || 0
            }));
        } catch (err) {
            console.error('Error exporting annotations:', err);
            return [];
        }
    }

    close() {
        console.log('✅ Database connection closed');
    }
}

module.exports = AnnotationDatabase;
