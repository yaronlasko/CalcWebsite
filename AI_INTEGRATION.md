# AI Model Integration Documentation

## Overview
This document describes the integration of the YOLO + U-Net calculus detection AI model into the web application's `/detect` endpoint.

## Architecture

### Components
1. **Node.js Server** (`server.js`) - Handles HTTP requests and file uploads
2. **Python AI Model** (`ai_model.py`) - Processes images using YOLO and U-Net
3. **Frontend** (`detect.html`, `detect.js`) - User interface for image upload and results display

### Data Flow
1. User uploads image via web interface
2. Node.js server receives image and saves to uploads directory
3. Server spawns Python process to run AI model
4. Python script processes image and returns JSON results
5. Server returns results to frontend
6. Frontend displays processed image and analysis results

## AI Model Details

### YOLO (Tooth Detection)
- **Model**: `segmentyolo.pt`
- **Purpose**: Detect and segment individual teeth in intraoral images
- **Input**: Full intraoral image
- **Output**: Bounding boxes and masks for each detected tooth

### U-Net (Calculus Segmentation)
- **Model**: `best_model.pth` 
- **Purpose**: Segment calculus regions within each detected tooth
- **Input**: Cropped tooth images (256x256 pixels)
- **Output**: Binary masks indicating calculus presence

### Processing Pipeline
1. Load original image
2. Run YOLO to detect teeth and get bounding boxes
3. For each detected tooth:
   - Extract tooth region with padding
   - Resize to 256x256 for U-Net input
   - Run U-Net to predict calculus
   - Resize prediction back to original tooth size
   - Calculate calculus coverage percentage
4. Create visualization overlay with red calculus highlights
5. Add percentage annotations for each tooth
6. Save processed image

## API Endpoints

### POST `/detect`
Upload an image for calculus detection analysis.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Image file (JPG, PNG, JPEG)

**Response:**
```json
{
  "success": true,
  "message": "Calculus detection completed successfully",
  "filename": "uploaded_filename.jpg",
  "results": {
    "teeth_detected": 12,
    "average_calculus_coverage": 15.3,
    "individual_results": [
      {
        "tooth_id": 1,
        "calculus_percentage": 23.4,
        "bounding_box": [100, 150, 200, 250]
      }
    ],
    "processed_image_url": "/uploads/images/processed_image.jpg",
    "original_image_url": "/uploads/images/original_image.jpg"
  }
}
```

## Frontend Features

### Image Upload
- Drag and drop support
- File type validation
- Preview of selected file
- Progress indication during processing

### Results Display
- Side-by-side comparison of original and processed images
- Summary statistics (teeth detected, average coverage)
- Individual tooth analysis grid
- Color-coded severity indicators:
  - **Green (Low)**: 0-10% calculus coverage
  - **Yellow (Medium)**: 10-20% calculus coverage  
  - **Red (High)**: >20% calculus coverage

### Responsive Design
- Mobile-friendly layout
- Adaptive image sizing
- Flexible grid layouts

## Installation & Setup

### Prerequisites
- Node.js 14+
- Python 3.8+
- pip package manager

### Dependencies

#### Python Dependencies
```
torch>=1.9.0
torchvision>=0.10.0
opencv-python>=4.5.0
ultralytics>=8.0.0
segmentation-models-pytorch>=0.3.0
PyYAML>=5.4.0
numpy>=1.21.0
Pillow>=8.3.0
```

#### Node.js Dependencies
```
express
multer
cors
helmet
morgan
express-session
dotenv
```

### Setup Instructions

1. **Install Dependencies**
   ```bash
   # On Windows
   setup.bat
   
   # On Linux/Mac
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Model Files**
   - Place `segmentyolo.pt` in parent directory
   - Place `best_model.pth` in parent directory
   - Ensure `default.yaml` config file exists

3. **Start Server**
   ```bash
   npm start
   ```

4. **Access Application**
   - Open browser to `http://localhost:3000`
   - Navigate to `/detect` for AI detection

## Configuration

### Model Paths
Edit `default.yaml` to configure model file paths:
```yaml
MODEL:
  WEIGHTS: "segmentyolo.pt"
UNET:
  WEIGHTS: "best_model.pth"
```

### Server Settings
Environment variables in `.env`:
```
PORT=3000
SESSION_SECRET=your_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Error Handling

### Common Issues
1. **Model files not found**: Ensure model files are in correct locations
2. **Python dependencies missing**: Run setup script to install requirements
3. **CUDA/GPU issues**: Model automatically falls back to CPU if GPU unavailable
4. **Large image processing**: Images are automatically resized for processing

### Troubleshooting
- Check console logs for detailed error messages
- Verify Python environment and dependencies
- Ensure sufficient disk space for image processing
- Test with different image formats/sizes

## Performance Considerations

### Processing Time
- YOLO detection: ~1-2 seconds per image
- U-Net segmentation: ~0.5 seconds per tooth
- Total processing time depends on number of teeth detected

### Memory Usage
- GPU memory recommended for optimal performance
- CPU fallback available but slower
- Large images may require significant RAM

### Scalability
- Single request processing (no batching)
- Could be extended with queue system for high volume
- Consider GPU server for production deployment

## Security Considerations

### File Upload Security
- File type validation
- Size limits enforced
- Secure file storage
- Automatic cleanup of temporary files

### API Security
- Input validation
- Error message sanitization
- Rate limiting recommended for production
- HTTPS recommended for production

## Future Enhancements

### Potential Improvements
1. **Real-time Processing**: WebSocket integration for live updates
2. **Batch Processing**: Multiple image analysis
3. **Export Features**: PDF reports, data export
4. **Historical Analysis**: Patient tracking over time
5. **Model Updates**: Hot-swappable model versions
6. **Cloud Integration**: AWS/Azure deployment options

### API Extensions
- RESTful API with authentication
- Webhook support for external integrations
- Database integration for result storage
- User management and permissions
