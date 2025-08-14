#!/usr/bin/env node

// Quick Firebase connectivity test
// This script helps verify if Firebase setup would work with credentials

const admin = require('firebase-admin');

console.log('🔥 Firebase Setup Test');
console.log('====================\n');

// Check if credentials are available
console.log('1. Checking for Firebase credentials...');

if (process.env.FIREBASE_CREDENTIALS) {
    console.log('✅ FIREBASE_CREDENTIALS environment variable is set');
    
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        console.log('✅ Credentials JSON is valid');
        console.log(`   Project ID: ${serviceAccount.project_id}`);
        console.log(`   Client Email: ${serviceAccount.client_email}`);
        
        // Try to initialize Firebase
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin SDK initialized successfully');
        console.log('\n🎉 Firebase setup is working! Your app should be able to connect.');
        
    } catch (error) {
        console.log('❌ Error with Firebase credentials:');
        console.log(error.message);
    }
    
} else {
    console.log('❌ FIREBASE_CREDENTIALS environment variable is not set');
    console.log('\n📋 To fix this, you need to:');
    console.log('1. Create a Firebase project at https://console.firebase.google.com');
    console.log('2. Generate a service account key (JSON file)');
    console.log('3. Set FIREBASE_CREDENTIALS environment variable in Render');
    console.log('\nFor detailed instructions, see FIREBASE_SETUP.md');
}

console.log('\n🔧 Current status: Firebase is not connected');
console.log('   This means annotations are only stored locally');
console.log('   and will be lost when the server restarts.\n');
