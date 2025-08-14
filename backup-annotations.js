#!/usr/bin/env node

/**
 * Annotation Backup Script
 * Downloads all annotations from your deployed Render app
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const RENDER_URL = 'https://your-app-name.onrender.com'; // 👈 CHANGE THIS TO YOUR RENDER URL
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const BACKUP_DIR = './annotation-backups';

async function authenticateAdmin() {
    try {
        const response = await axios.post(`${RENDER_URL}/admin/login`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        }, {
            withCredentials: true
        });
        
        return response.data.success;
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        return false;
    }
}

async function downloadAnnotations() {
    try {
        console.log('🔍 Fetching annotations from:', RENDER_URL);
        
        const response = await axios.get(`${RENDER_URL}/api/admin/annotations`, {
            withCredentials: true
        });
        
        const annotations = response.data.annotations || [];
        console.log(`📊 Found ${annotations.length} annotations`);
        
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        
        // Save annotations list
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const listPath = path.join(BACKUP_DIR, `annotations-list-${timestamp}.json`);
        fs.writeFileSync(listPath, JSON.stringify(annotations, null, 2));
        console.log(`💾 Saved annotations list to: ${listPath}`);
        
        // Download individual annotation files
        let downloadCount = 0;
        for (const annotation of annotations) {
            try {
                if (annotation.path) {
                    const fileResponse = await axios.get(`${RENDER_URL}${annotation.path}`, {
                        responseType: 'stream',
                        withCredentials: true
                    });
                    
                    const filename = path.basename(annotation.path);
                    const filePath = path.join(BACKUP_DIR, filename);
                    
                    const writer = fs.createWriteStream(filePath);
                    fileResponse.data.pipe(writer);
                    
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
                    
                    downloadCount++;
                    console.log(`📥 Downloaded: ${filename}`);
                }
            } catch (error) {
                console.error(`❌ Failed to download ${annotation.path}:`, error.message);
            }
        }
        
        console.log(`✅ Successfully downloaded ${downloadCount} annotation files`);
        console.log(`📁 All files saved to: ${BACKUP_DIR}`);
        
    } catch (error) {
        console.error('❌ Error downloading annotations:', error.message);
    }
}

async function main() {
    console.log('🚀 Starting annotation backup...');
    console.log('===============================');
    
    // Check if URL is configured
    if (RENDER_URL.includes('your-app-name')) {
        console.log('❌ Please update RENDER_URL in this script with your actual Render URL');
        console.log('   Find your URL in your Render dashboard');
        return;
    }
    
    // Authenticate
    const authenticated = await authenticateAdmin();
    if (!authenticated) {
        console.log('❌ Failed to authenticate. Please check your credentials.');
        return;
    }
    
    console.log('✅ Authenticated successfully');
    
    // Download annotations
    await downloadAnnotations();
}

// Run the script
main().catch(console.error);
