#!/usr/bin/env node

/**
 * Database Setup and Deployment Script
 */

const { spawn } = require('child_process');
const fs = require('fs');

function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, { stdio: 'inherit' });
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
    });
}

async function setupDatabase() {
    console.log('🗄️ Setting up database storage for annotations...');
    console.log('================================================');
    
    try {
        // Step 1: Install dependencies
        console.log('📦 Installing SQLite dependency...');
        await runCommand('npm', ['install', 'sqlite3']);
        console.log('✅ Dependencies installed');
        
        // Step 2: Create database directory
        console.log('📁 Creating database directory...');
        if (!fs.existsSync('./database')) {
            fs.mkdirSync('./database', { recursive: true });
        }
        
        // Step 3: Test database connection
        console.log('🔧 Testing database connection...');
        const AnnotationDatabase = require('./database/annotation-db');
        const db = new AnnotationDatabase();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for init
        db.close();
        console.log('✅ Database connection successful');
        
        // Step 4: Check for existing annotations to migrate
        if (fs.existsSync('./uploads/annotations')) {
            const files = fs.readdirSync('./uploads/annotations');
            const jsonFiles = files.filter(f => f.endsWith('.json'));
            
            if (jsonFiles.length > 0) {
                console.log(`📋 Found ${jsonFiles.length} existing annotations`);
                console.log('🔄 Running migration...');
                await runCommand('node', ['migrate-to-database.js']);
            } else {
                console.log('ℹ️  No existing annotations to migrate');
            }
        }
        
        console.log('\n🎉 Database setup complete!');
        console.log('\n📊 Next steps:');
        console.log('1. Start your server: npm start');
        console.log('2. Test locally at: http://localhost:3000');
        console.log('3. Deploy to Render when ready');
        console.log('4. Use database-monitor.html for enhanced monitoring');
        
        console.log('\n🔍 New features available:');
        console.log('- Permanent annotation storage');
        console.log('- Enhanced admin analytics');
        console.log('- Data export capabilities');
        console.log('- Real-time user statistics');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n🛠️  Manual setup steps:');
        console.log('1. npm install sqlite3');
        console.log('2. node migrate-to-database.js (if you have existing annotations)');
        console.log('3. npm start');
    }
}

setupDatabase();
