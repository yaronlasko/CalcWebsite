const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test script to verify AI model integration
console.log('🧪 Testing AI Model Integration...\n');

// Test 1: Check if Python is available
console.log('1. Testing Python availability...');
const pythonTest = spawn('python', ['--version']);
pythonTest.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Python is available');
    } else {
        console.log('❌ Python is not available or not in PATH');
    }
});

// Test 2: Check if required files exist
console.log('2. Checking required files...');
const requiredFiles = [
    'ai_model.py',
    'requirements.txt',
    '../segmentyolo.pt',
    '../best_model.pth',
    '../default.yaml'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} is missing`);
    }
});

// Test 3: Check if Python dependencies are installed
console.log('3. Testing Python dependencies...');
const testDependencies = ['torch', 'cv2', 'ultralytics', 'segmentation_models_pytorch', 'yaml'];
testDependencies.forEach(dep => {
    const depTest = spawn('python', ['-c', `import ${dep}`]);
    depTest.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ ${dep} is installed`);
        } else {
            console.log(`❌ ${dep} is not installed`);
        }
    });
});

// Test 4: Test AI model script with dummy data
console.log('4. Testing AI model script...');
if (fs.existsSync('ai_model.py')) {
    const aiTest = spawn('python', ['ai_model.py']);
    aiTest.stdout.on('data', (data) => {
        console.log('📄 AI Model Output:', data.toString());
    });
    aiTest.stderr.on('data', (data) => {
        console.log('⚠️  AI Model Error:', data.toString());
    });
    aiTest.on('close', (code) => {
        if (code === 0) {
            console.log('✅ AI model script executed successfully');
        } else {
            console.log('❌ AI model script failed');
        }
    });
}

// Test 5: Check Node.js dependencies
console.log('5. Checking Node.js dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['express', 'multer', 'cors', 'helmet'];
requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
        console.log(`✅ ${dep} is in package.json`);
    } else {
        console.log(`❌ ${dep} is missing from package.json`);
    }
});

// Test 6: Check if uploads directory exists
console.log('6. Checking upload directories...');
const uploadDirs = ['uploads', 'uploads/images', 'uploads/test-images'];
uploadDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir} exists`);
    } else {
        console.log(`❌ ${dir} is missing`);
    }
});

console.log('\n🔬 Test complete! Review the results above to ensure everything is properly configured.');
console.log('📚 For setup instructions, run: setup.bat (Windows) or ./setup.sh (Linux/Mac)');
