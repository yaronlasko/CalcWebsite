#!/usr/bin/env node

/**
 * Clear Database Script
 * This script clears all annotation data from both local and Firebase storage
 */

const fs = require('fs');
const path = require('path');
const AnnotationDatabase = require('./database/annotation-db');

async function clearDatabase() {
    console.log('🗑️  Clearing all annotation data...');
    console.log('====================================\n');
    
    const db = new AnnotationDatabase();
    
    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
        // 1. Clear Firebase data if connected
        if (db.firebaseStorage && db.firebaseStorage.isInitialized) {
            console.log('🔥 Clearing Firebase data...');
            
            try {
                // Get all collections and clear them
                const collections = ['annotations', 'users', 'images'];
                
                for (const collectionName of collections) {
                    const collection = db.firebaseStorage.db.collection(collectionName);
                    const snapshot = await collection.get();
                    
                    if (!snapshot.empty) {
                        const batch = db.firebaseStorage.db.batch();
                        snapshot.docs.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                        console.log(`   ✅ Cleared ${snapshot.size} documents from ${collectionName} collection`);
                    } else {
                        console.log(`   ℹ️  ${collectionName} collection already empty`);
                    }
                }
                
                console.log('✅ Firebase database cleared successfully!\n');
                
            } catch (error) {
                console.error('❌ Error clearing Firebase:', error.message);
            }
        } else {
            console.log('⚠️  Firebase not connected - skipping Firebase cleanup\n');
        }
        
        // 2. Clear local JSON files
        console.log('📂 Clearing local JSON files...');
        
        const dataDir = path.join(__dirname, 'data');
        const localFiles = [
            path.join(dataDir, 'annotations.json'),
            path.join(dataDir, 'users.json'), 
            path.join(dataDir, 'images.json')
        ];
        
        for (const filePath of localFiles) {
            if (fs.existsSync(filePath)) {
                const fileName = path.basename(filePath);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let count = 0;
                
                if (Array.isArray(data)) {
                    count = data.length;
                    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
                } else if (typeof data === 'object') {
                    count = Object.keys(data).length;
                    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
                }
                
                console.log(`   ✅ Cleared ${count} entries from ${fileName}`);
            }
        }
        
        console.log('✅ Local JSON files cleared successfully!\n');
        
        // 3. Clear annotation image files (optional)
        console.log('🖼️  Clearing annotation image files...');
        
        const annotationsDir = path.join(__dirname, 'uploads', 'annotations');
        if (fs.existsSync(annotationsDir)) {
            const files = fs.readdirSync(annotationsDir);
            const imageFiles = files.filter(file => 
                file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.json')
            );
            
            for (const file of imageFiles) {
                fs.unlinkSync(path.join(annotationsDir, file));
            }
            
            console.log(`   ✅ Deleted ${imageFiles.length} annotation files`);
        }
        
        console.log('✅ Annotation files cleared successfully!\n');
        
        // 4. Summary
        console.log('🎉 DATABASE CLEARED SUCCESSFULLY!');
        console.log('================================');
        console.log('✅ Firebase collections cleared (if connected)');
        console.log('✅ Local JSON files reset');
        console.log('✅ Annotation image files deleted');
        console.log('\n📊 Your database is now completely empty and ready for new annotations.');
        
        if (!db.firebaseStorage.isInitialized) {
            console.log('\n💡 TIP: Set up Firebase credentials to prevent data loss on server restarts.');
            console.log('   See FIREBASE_SETUP.md for instructions.');
        }
        
    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        // Close database connections
        if (db && db.close) {
            db.close();
        }
        console.log('\n✅ Database connections closed.');
    }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL annotation data!');
console.log('   - All Firebase data (if connected)');
console.log('   - All local JSON data');
console.log('   - All annotation image files');
console.log('');

// Simple confirmation - user must pass --confirm flag
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
    clearDatabase().catch(console.error);
} else {
    console.log('❌ Operation cancelled. To proceed, run:');
    console.log('   node clear-database.js --confirm');
    console.log('');
    process.exit(1);
}
