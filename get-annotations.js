#!/usr/bin/env node

/**
 * Get Annotations Script
 * Quick script to view your annotations locally or from deployed app
 */

const AnnotationDatabase = require('./database/annotation-db');

async function getAnnotations() {
    console.log('📊 Fetching annotations from database...\n');
    
    try {
        const db = new AnnotationDatabase();
        
        // Wait for database initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get overall stats
        const stats = await db.getAnnotationStats();
        console.log('📈 OVERVIEW STATISTICS');
        console.log('====================');
        console.log(`Total annotations: ${stats.total_annotations}`);
        console.log(`Unique users: ${stats.unique_users}`);
        console.log(`Annotated images: ${stats.annotated_images}`);
        console.log(`Test annotations: ${stats.test_annotations}`);
        console.log(`Annotate annotations: ${stats.annotate_annotations}\n`);
        
        // Get user stats
        const userStats = await db.getUserStats();
        console.log('👥 USER STATISTICS');
        console.log('==================');
        if (userStats.length > 0) {
            userStats.forEach((user, index) => {
                console.log(`${index + 1}. User ${user.user_id}: ${user.total_annotations} annotations`);
                console.log(`   First: ${new Date(user.first_annotation).toLocaleDateString()}`);
                console.log(`   Last: ${new Date(user.last_annotation).toLocaleDateString()}`);
            });
        } else {
            console.log('No user data available');
        }
        
        console.log('\n📋 RECENT ANNOTATIONS');
        console.log('=====================');
        
        // Get recent annotations
        const recent = await db.getAllAnnotations(10);
        if (recent.length > 0) {
            recent.forEach((annotation, index) => {
                console.log(`${index + 1}. ${annotation.original_image}`);
                console.log(`   User: ${annotation.user_id}`);
                console.log(`   Date: ${new Date(annotation.timestamp).toLocaleString()}`);
                console.log(`   Source: ${annotation.source}`);
                console.log(`   ID: ${annotation.id}`);
                console.log('');
            });
        } else {
            console.log('No annotations found');
        }
        
        // Get annotations by specific user (example)
        if (userStats.length > 0) {
            const topUser = userStats[0];
            console.log(`\n🎯 ANNOTATIONS BY USER ${topUser.user_id}`);
            console.log('================================');
            
            const userAnnotations = await db.getAnnotationsByUser(topUser.user_id);
            userAnnotations.slice(0, 5).forEach((annotation, index) => {
                console.log(`${index + 1}. ${annotation.original_image} (${new Date(annotation.timestamp).toLocaleDateString()})`);
            });
            
            if (userAnnotations.length > 5) {
                console.log(`... and ${userAnnotations.length - 5} more`);
            }
        }
        
        db.close();
        console.log('\n✅ Done!');
        
    } catch (error) {
        console.error('❌ Error fetching annotations:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure you\'ve run: npm install sqlite3');
        console.log('2. Make sure the database exists (run the server once)');
        console.log('3. Check if you need to migrate: node migrate-to-database.js');
    }
}

getAnnotations();
