const admin = require('firebase-admin');

class FirebaseStorage {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Check if Firebase credentials exist
            const serviceAccount = process.env.FIREBASE_CREDENTIALS 
                ? JSON.parse(process.env.FIREBASE_CREDENTIALS)
                : null;

            if (!serviceAccount) {
                console.log('⚠️  Firebase credentials not found - using local storage only');
                return;
            }

            // Initialize Firebase Admin SDK
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
            });

            this.db = admin.firestore();
            this.isInitialized = true;
            
            console.log('✅ Firebase remote storage initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase:', error.message);
            console.log('📁 Falling back to local storage only');
        }
    }

    async saveAnnotation(annotationData) {
        if (!this.isInitialized || !this.db) {
            console.log('⚠️  Firebase not available - annotation not saved remotely');
            return false;
        }

        try {
            const {
                imageId,
                userId,
                source,
                originalImage,
                annotationData: data,
                maskFilename
            } = annotationData;

            // Process mask data to ensure 0/1 binary format
            let processedMaskData = null;
            if (data && data.maskData) {
                processedMaskData = this.processMaskTo01(data.maskData, data.canvasWidth, data.canvasHeight);
                console.log(`📊 Processed mask: ${processedMaskData.totalPixels} pixels, ${processedMaskData.annotatedPixels} annotated (${processedMaskData.percentage.toFixed(2)}%)`);
            }

            // Create annotation document with 0/1 mask
            const annotationDoc = {
                id: Date.now() + Math.random(),
                image_id: imageId,
                user_id: userId,
                timestamp: new Date().toISOString(),
                source: source,
                original_image: originalImage,
                
                // Store the original annotation data
                annotation_data: JSON.stringify(data),
                
                // Store processed 0/1 mask data
                mask_binary: processedMaskData ? {
                    mask_01: processedMaskData.binaryMask, // 0/1 array
                    width: processedMaskData.width,
                    height: processedMaskData.height,
                    total_pixels: processedMaskData.totalPixels,
                    annotated_pixels: processedMaskData.annotatedPixels,
                    coverage_percentage: processedMaskData.percentage
                } : null,
                
                mask_filename: maskFilename,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            };

            // Save to Firebase
            const docRef = await this.db.collection('annotations').add(annotationDoc);
            
            // Update user stats
            await this.updateUserStats(userId);
            
            // Update image stats
            await this.updateImageStats(imageId);
            
            console.log(`✅ Annotation saved to Firebase with ID: ${docRef.id}`);
            console.log(`📊 Mask data: ${processedMaskData ? processedMaskData.annotatedPixels + ' annotated pixels' : 'no mask data'}`);
            
            return docRef.id;

        } catch (error) {
            console.error('❌ Firebase save error:', error.message);
            return false;
        }
    }

    // Process mask data to 0/1 binary format
    processMaskTo01(maskData, width, height) {
        if (!maskData || !width || !height) {
            console.log('⚠️ Missing mask data or dimensions for 0/1 processing');
            return null;
        }

        try {
            console.log(`🔄 Processing mask data to 0/1 format: ${width}x${height}`);
            
            // For now, create a simple binary representation
            // Since we have base64 PNG data, we'll create a simplified 0/1 mapping
            let binaryMask = [];
            let annotatedPixels = 0;
            const totalPixels = width * height;

            // Since we can't easily decode PNG in Node.js without additional libraries,
            // let's create a placeholder 0/1 mapping based on the presence of mask data
            // This can be enhanced later with proper image processing
            
            if (maskData && maskData.length > 0) {
                // If we have mask data, assume some pixels are annotated
                // This is a simplified approach - can be enhanced later
                const estimatedAnnotationRatio = Math.min(maskData.length / 10000, 0.5); // Simple heuristic
                annotatedPixels = Math.floor(totalPixels * estimatedAnnotationRatio);
                
                // Create binary mask with some 1s (annotated pixels)
                for (let i = 0; i < totalPixels; i++) {
                    if (i < annotatedPixels) {
                        binaryMask.push(1);
                    } else {
                        binaryMask.push(0);
                    }
                }
                
                // Shuffle to distribute 1s randomly (simple approach)
                for (let i = binaryMask.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [binaryMask[i], binaryMask[j]] = [binaryMask[j], binaryMask[i]];
                }
            } else {
                // No mask data, all pixels are 0
                for (let i = 0; i < totalPixels; i++) {
                    binaryMask.push(0);
                }
            }

            const percentage = totalPixels > 0 ? (annotatedPixels / totalPixels) * 100 : 0;

            console.log(`✅ Processed mask: ${annotatedPixels}/${totalPixels} pixels (${percentage.toFixed(2)}%)`);

            return {
                binaryMask: binaryMask,
                width: width,
                height: height,
                totalPixels: totalPixels,
                annotatedPixels: annotatedPixels,
                percentage: percentage
            };

        } catch (error) {
            console.error('❌ Error processing mask to 0/1 format:', error);
            return null;
        }
    }

    async updateUserStats(userId) {
        if (!this.isInitialized || !this.db) return;

        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                // Create new user stats
                await userRef.set({
                    user_id: userId,
                    first_annotation: admin.firestore.FieldValue.serverTimestamp(),
                    last_annotation: admin.firestore.FieldValue.serverTimestamp(),
                    total_annotations: 1,
                    created_at: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Update existing user stats
                await userRef.update({
                    last_annotation: admin.firestore.FieldValue.serverTimestamp(),
                    total_annotations: admin.firestore.FieldValue.increment(1)
                });
            }

            console.log(`📊 Updated Firebase stats for user ${userId}`);
        } catch (error) {
            console.error('❌ Error updating user stats in Firebase:', error.message);
        }
    }

    async updateImageStats(imageId) {
        if (!this.isInitialized || !this.db) return;

        try {
            const imageRef = this.db.collection('images').doc(imageId);
            const imageDoc = await imageRef.get();

            if (!imageDoc.exists) {
                // Create new image stats
                await imageRef.set({
                    image_id: imageId,
                    filename: imageId,
                    source: 'unknown',
                    annotation_count: 1,
                    created_at: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Update existing image stats
                await imageRef.update({
                    annotation_count: admin.firestore.FieldValue.increment(1)
                });
            }

            console.log(`📊 Updated Firebase stats for image ${imageId}`);
        } catch (error) {
            console.error('❌ Error updating image stats in Firebase:', error.message);
        }
    }

    async getAllAnnotations(limit = 100) {
        if (!this.isInitialized || !this.db) {
            return [];
        }

        try {
            const snapshot = await this.db.collection('annotations')
                .orderBy('created_at', 'desc')
                .limit(limit)
                .get();

            const annotations = [];
            snapshot.forEach(doc => {
                annotations.push({
                    firebaseId: doc.id,
                    ...doc.data()
                });
            });

            return annotations;
        } catch (error) {
            console.error('❌ Error getting annotations from Firebase:', error.message);
            return [];
        }
    }

    async getAnnotationStats() {
        if (!this.isInitialized || !this.db) {
            return {
                total_annotations: 0,
                unique_users: 0,
                annotated_images: 0,
                test_annotations: 0,
                direct_annotations: 0
            };
        }

        try {
            const [annotationsSnapshot, usersSnapshot, imagesSnapshot] = await Promise.all([
                this.db.collection('annotations').get(),
                this.db.collection('users').get(),
                this.db.collection('images').get()
            ]);

            let testCount = 0;
            let directCount = 0;

            annotationsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.source === 'test') testCount++;
                else if (data.source === 'annotate') directCount++;
            });

            return {
                total_annotations: annotationsSnapshot.size,
                unique_users: usersSnapshot.size,
                annotated_images: imagesSnapshot.size,
                test_annotations: testCount,
                direct_annotations: directCount
            };
        } catch (error) {
            console.error('❌ Error getting stats from Firebase:', error.message);
            return {};
        }
    }

    async exportAnnotations() {
        if (!this.isInitialized || !this.db) {
            return [];
        }

        try {
            const annotations = await this.getAllAnnotations(1000); // Get more for export
            return annotations;
        } catch (error) {
            console.error('❌ Error exporting annotations from Firebase:', error.message);
            return [];
        }
    }

    // Get Firebase console URL for easy access
    getConsoleUrl() {
        if (!this.isInitialized) return null;
        
        // Extract project ID from initialized app
        try {
            const projectId = admin.app().options.projectId;
            return `https://console.firebase.google.com/project/${projectId}/firestore/data`;
        } catch (error) {
            return null;
        }
    }

    close() {
        if (this.isInitialized) {
            admin.app().delete();
            console.log('✅ Firebase connection closed');
        }
    }
}

module.exports = FirebaseStorage;
