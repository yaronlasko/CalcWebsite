#!/usr/bin/env node

/**
 * Quick Annotation Checker
 * Checks how many annotations you have without downloading them
 */

const axios = require('axios');

// Configuration - UPDATE WITH YOUR RENDER URL
const RENDER_URL = 'https://your-app-name.onrender.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function checkAnnotations() {
    try {
        console.log('🔍 Checking annotations on:', RENDER_URL);
        
        // Authenticate
        const authResponse = await axios.post(`${RENDER_URL}/admin/login`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        }, {
            withCredentials: true
        });
        
        if (!authResponse.data.success) {
            console.log('❌ Authentication failed');
            return;
        }
        
        // Get annotations
        const response = await axios.get(`${RENDER_URL}/api/admin/annotations`, {
            withCredentials: true
        });
        
        const annotations = response.data.annotations || [];
        
        console.log('📊 ANNOTATION SUMMARY');
        console.log('====================');
        console.log(`Total annotations: ${annotations.length}`);
        
        // Group by source
        const testAnnotations = annotations.filter(a => a.source === 'test');
        const annotateAnnotations = annotations.filter(a => a.source === 'annotate');
        
        console.log(`├── Test annotations: ${testAnnotations.length}`);
        console.log(`└── Annotate annotations: ${annotateAnnotations.length}`);
        
        // Group by user
        const userCounts = {};
        annotations.forEach(annotation => {
            const userId = annotation.userId || 'anonymous';
            userCounts[userId] = (userCounts[userId] || 0) + 1;
        });
        
        console.log('\n👥 ANNOTATIONS BY USER');
        console.log('=====================');
        Object.entries(userCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([userId, count]) => {
                console.log(`User ${userId}: ${count} annotations`);
            });
        
        // Recent annotations
        if (annotations.length > 0) {
            const recent = annotations
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);
            
            console.log('\n🕐 RECENT ANNOTATIONS');
            console.log('===================');
            recent.forEach(annotation => {
                const date = new Date(annotation.timestamp).toLocaleString();
                console.log(`${date} - User ${annotation.userId} - ${annotation.originalImage}`);
            });
        }
        
        console.log('\n✅ Check complete!');
        
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('❌ Authentication failed. Please check your credentials.');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Check if URL is configured
if (RENDER_URL.includes('your-app-name')) {
    console.log('❌ Please update RENDER_URL in this script with your actual Render URL');
    console.log('   Example: https://calculus-detection-abc123.onrender.com');
    process.exit(1);
}

checkAnnotations();
