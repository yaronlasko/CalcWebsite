#!/usr/bin/env node

/**
 * Migration script to move existing file-based annotations to database
 */

const fs = require('fs');
const path = require('path');
const AnnotationDatabase = require('./database/annotation-db');

async function migrateAnnotations() {
    console.log('🔄 Starting annotation migration to database...');
    
    const annotationDB = new AnnotationDatabase();
    const annotationDir = path.join(__dirname, 'uploads', 'annotations');
    
    if (!fs.existsSync(annotationDir)) {
        console.log('❌ No annotations directory found. Nothing to migrate.');
        annotationDB.close();
        return;
    }
    
    const files = fs.readdirSync(annotationDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📊 Found ${jsonFiles.length} annotation metadata files to migrate`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const file of jsonFiles) {
        try {
            const filePath = path.join(annotationDir, file);
            const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Look for corresponding PNG file
            const pngFile = file.replace('.json', '.png');
            const pngPath = path.join(annotationDir, pngFile);
            
            let maskData = null;
            if (fs.existsSync(pngPath)) {
                // Read the PNG file and convert to base64
                const imageBuffer = fs.readFileSync(pngPath);
                maskData = imageBuffer.toString('base64');
            }
            
            // Prepare data for database
            const annotationData = {
                imageId: metadata.imageId,
                userId: metadata.userId || 'anonymous',
                source: metadata.source,
                originalImage: metadata.originalImage,
                maskData: maskData,
                maskFilename: metadata.filename || pngFile
            };
            
            // Save to database
            await annotationDB.saveAnnotation(annotationData);
            migrated++;
            
            console.log(`✅ Migrated: ${file}`);
            
        } catch (error) {
            console.error(`❌ Error migrating ${file}:`, error.message);
            errors++;
        }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrated} annotations`);
    console.log(`❌ Errors: ${errors} annotations`);
    console.log(`📊 Total processed: ${jsonFiles.length} files`);
    
    // Get stats from database
    try {
        const stats = await annotationDB.getAnnotationStats();
        console.log('\n🗄️ Database Stats:');
        console.log(`   Total annotations: ${stats.total_annotations}`);
        console.log(`   Unique users: ${stats.unique_users}`);
        console.log(`   Test annotations: ${stats.test_annotations}`);
        console.log(`   Annotate annotations: ${stats.annotate_annotations}`);
    } catch (error) {
        console.error('Error getting database stats:', error.message);
    }
    
    annotationDB.close();
    console.log('\n🎉 Migration complete!');
}

// Run migration
migrateAnnotations().catch(console.error);
