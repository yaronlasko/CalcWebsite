# 📊 Annotation Data Storage & Monitoring Guide

## 🗂️ Where Your Annotations Are Saved

### Local Storage Structure
```
uploads/
├── annotations/              # 👈 ALL ANNOTATIONS SAVED HERE
│   ├── test-image-1-timestamp.png      # Annotation masks (PNG images)
│   ├── test-image-1-timestamp.json     # Annotation metadata
│   ├── annotate-image-2-timestamp.png  # Annotation masks
│   └── annotate-image-2-timestamp.json # Annotation metadata
├── test-images/             # Test images for user testing
├── annotate-images/         # Images for open annotation
└── images/                  # Uploaded images from detect feature
```

### What Gets Saved When Users Annotate:
1. **Annotation Mask** (`.png` file) - The actual drawing/annotation
2. **Metadata** (`.json` file) - Information about the annotation:
   ```json
   {
     "imageId": "test-image-1",
     "userId": "5",
     "timestamp": "2025-07-16T10:30:00.000Z",
     "filename": "test-image-1-1751234567890.png",
     "source": "test",
     "originalImage": "DSC_5665.JPG"
   }
   ```

## 🔍 How to Monitor Your Annotations

### Option 1: Admin Dashboard (Already Built!)
- Go to your deployed site: `https://your-app.onrender.com/view`
- Login with: `admin` / `admin123`
- You can see all annotations through the admin interface

### Option 2: Direct API Access
- Get all annotations: `GET /api/admin/annotations`
- Get specific image annotations: `GET /api/annotations/:imageId`
- Requires admin authentication

### Option 3: Download Annotations Script
I'll create a script to help you download all annotations from your deployed app.

## ⚠️ Important: Render Deployment Storage

### How Render Handles File Storage:
- **Temporary Storage**: Files are stored temporarily on Render's servers
- **Persistence**: Files persist during the app's lifetime but may be lost on:
  - App restarts
  - Deployments
  - Server maintenance
  - Extended inactivity

### Recommended Solutions:

#### 1. **Add Database Storage (Recommended)**
Store annotation metadata in a database instead of JSON files.

#### 2. **Add Cloud Storage Integration**
Store annotation files in AWS S3, Google Cloud Storage, or similar.

#### 3. **Regular Backups**
Use the download script I'm creating to regularly backup your annotations.

## 🛠️ Immediate Actions You Can Take

### 1. Check Current Annotations
Visit your admin dashboard at: `https://your-app.onrender.com/view`

### 2. Set Up Monitoring
I'll create a monitoring script that checks your annotations regularly.

### 3. Implement Backup Strategy
Use the backup script I'm creating to save annotations locally.

## 📧 Get Notified When Users Annotate

Would you like me to add email notifications when users complete annotations? This would help you track activity in real-time.

## 🔧 Next Steps

1. **Check your admin dashboard** to see current annotations
2. **Use the backup script** I'm creating to save annotations locally
3. **Consider upgrading to a database** for permanent storage
4. **Set up automated backups** to prevent data loss

The good news is that your annotations are being saved correctly! The main concern is ensuring they persist long-term on Render's platform.
