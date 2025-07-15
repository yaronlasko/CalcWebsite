const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch').default;
const path = require('path');

async function testUpload() {
    const form = new FormData();
    const imagePath = path.join(__dirname, 'uploads', 'test-images', 'DSC02079.JPG');
    
    if (!fs.existsSync(imagePath)) {
        console.error('Test image not found:', imagePath);
        return;
    }
    
    form.append('image', fs.createReadStream(imagePath));
    
    try {
        const response = await fetch('http://localhost:3000/detect', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testUpload();
