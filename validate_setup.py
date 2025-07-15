#!/usr/bin/env python3
"""
Setup Validation Script
This script validates that all required components are installed and working correctly.
"""

import sys
import os
import json
import subprocess
import requests
import time
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.8+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        return False, f"Python {version.major}.{version.minor} (requires 3.8+)"
    return True, f"Python {version.major}.{version.minor}.{version.micro}"

def check_required_packages():
    """Check if required Python packages are installed"""
    required_packages = [
        ('torch', 'torch'), 
        ('torchvision', 'torchvision'), 
        ('ultralytics', 'ultralytics'),
        ('opencv-python', 'cv2'), 
        ('segmentation-models-pytorch', 'segmentation_models_pytorch'),
        ('numpy', 'numpy'), 
        ('pillow', 'PIL'), 
        ('pyyaml', 'yaml'),
        ('requests', 'requests')
    ]
    
    missing = []
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
        except ImportError:
            missing.append(package_name)
    
    if missing:
        return False, f"Missing packages: {', '.join(missing)}"
    return True, "All required packages installed"

def check_model_files():
    """Check if model files exist"""
    parent_dir = Path(__file__).parent.parent
    yolo_model = parent_dir / "segmentyolo.pt"
    unet_model = parent_dir / "best_model.pth"
    config_file = parent_dir / "default.yaml"
    
    missing = []
    if not yolo_model.exists():
        missing.append("segmentyolo.pt")
    if not unet_model.exists():
        missing.append("best_model.pth")
    if not config_file.exists():
        missing.append("default.yaml")
    
    if missing:
        return False, f"Missing model files: {', '.join(missing)}"
    return True, "All model files present"

def check_node_dependencies():
    """Check if Node.js dependencies are installed"""
    node_modules = Path("node_modules")
    if not node_modules.exists():
        return False, "node_modules directory not found"
    
    package_json = Path("package.json")
    if not package_json.exists():
        return False, "package.json not found"
    
    return True, "Node.js dependencies installed"

def check_server_response():
    """Check if the server responds to requests"""
    try:
        # Check if server is running
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            return True, "Server responding correctly"
        else:
            return False, f"Server responded with status {response.status_code}"
    except requests.exceptions.ConnectionError:
        return False, "Server not running or not accessible"
    except requests.exceptions.Timeout:
        return False, "Server response timeout"
    except Exception as e:
        return False, f"Server check failed: {str(e)}"

def test_ai_model():
    """Test if AI model can process an image"""
    try:
        # Check if test image exists
        test_image = Path("uploads/test-images/1.jpg")
        if not test_image.exists():
            return False, "Test image not found"
        
        # Run AI model
        result = subprocess.run([
            sys.executable, "ai_model.py", str(test_image)
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            return False, f"AI model failed: {result.stderr}"
        
        # Parse result
        try:
            output = json.loads(result.stdout)
            if output.get("success"):
                return True, f"AI model working (detected {output.get('teeth_detected', 0)} teeth)"
            else:
                return False, f"AI model error: {output.get('error', 'Unknown error')}"
        except json.JSONDecodeError:
            return False, "AI model output not valid JSON"
    
    except subprocess.TimeoutExpired:
        return False, "AI model test timed out"
    except Exception as e:
        return False, f"AI model test failed: {str(e)}"

def main():
    """Run all validation checks"""
    print("🦷 Dental Calculus Detection - Setup Validation")
    print("=" * 50)
    
    checks = [
        ("Python Version", check_python_version),
        ("Required Packages", check_required_packages),
        ("Model Files", check_model_files),
        ("Node.js Dependencies", check_node_dependencies),
        ("Server Response", check_server_response),
        ("AI Model", test_ai_model)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n🔍 Checking {name}...")
        try:
            success, message = check_func()
            if success:
                print(f"✅ {message}")
                results.append(True)
            else:
                print(f"❌ {message}")
                results.append(False)
        except Exception as e:
            print(f"❌ Error during {name} check: {str(e)}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 All checks passed! ({passed}/{total})")
        print("✅ Your setup is ready for production!")
        return 0
    else:
        print(f"⚠️  {passed}/{total} checks passed")
        print("❌ Please fix the issues above before running the application")
        return 1

if __name__ == "__main__":
    sys.exit(main())
