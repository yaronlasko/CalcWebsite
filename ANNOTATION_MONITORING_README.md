# 📊 ANNOTATION MONITORING TOOLS

## 🎯 Where Your Annotations Are Saved

### On Your Deployed Render App:
```
uploads/annotations/
├── test-image-1-1642234567890.png      # User's annotation drawing
├── test-image-1-1642234567890.json     # Metadata (user, timestamp, etc.)
├── test-image-2-1642234567891.png      # Another user's annotation
└── test-image-2-1642234567891.json     # Its metadata
```

### Each annotation includes:
- **PNG file**: The actual drawing/annotation mask
- **JSON file**: Metadata with user ID, timestamp, original image name

## 🛠️ Tools I've Created for You

### 1. 🖥️ **Visual Monitor Dashboard** (annotation-monitor.html)
**Best for: Real-time monitoring**

1. Open `annotation-monitor.html` in your browser
2. Enter your Render app URL (e.g., `https://your-app.onrender.com`)
3. Click "Check Annotations"
4. See live stats and recent annotations

### 2. 🔍 **Quick Checker Script** (check-annotations.js)
**Best for: Command-line checking**

1. Edit the script and add your Render URL
2. Run: `node check-annotations.js`
3. See summary of all annotations

### 3. 💾 **Backup Script** (backup-annotations.js)
**Best for: Downloading all annotations**

1. Edit the script and add your Render URL
2. Run: `node backup-annotations.js`
3. All annotations downloaded to `./annotation-backups/`

## 🚀 Quick Start

### Step 1: Get Your Render URL
1. Go to your Render dashboard
2. Find your app URL (e.g., `https://calculus-detection-abc123.onrender.com`)

### Step 2: Use the Visual Monitor
1. Open `annotation-monitor.html` in your browser
2. Enter your Render URL
3. Use admin credentials: `admin` / `admin123`
4. Click "Check Annotations"

### Step 3: Check Your Current Annotations
Your live admin dashboard: `https://your-app.onrender.com/view`

## 📈 What You'll See

### User Activity:
- Total annotations created
- Annotations per user (User 1, User 2, etc.)
- Recent annotation activity
- Which images are being annotated most

### Data Breakdown:
- **Test annotations**: From users doing the test (User 1-100)
- **Annotate annotations**: From the open annotation tool
- **Timestamps**: When each annotation was created
- **Original images**: Which images were annotated

## ⚠️ Important Storage Notes

### Render File Storage:
- ✅ **Persistent during app lifetime**
- ❌ **May be lost on app restarts/deployments**
- ❌ **Not guaranteed long-term storage**

### Recommendations:
1. **Use the backup script regularly** to save annotations locally
2. **Monitor activity** with the visual dashboard
3. **Consider upgrading to database storage** for permanent data

## 🔧 Admin Access

### Your Admin Dashboard:
- **URL**: `https://your-app.onrender.com/view`
- **Username**: `admin`
- **Password**: `admin123` (change this in production!)

### Admin Features:
- View all annotations
- See user activity
- Download annotation data
- Monitor system usage

## 📱 Mobile-Friendly

All monitoring tools work on mobile devices, so you can check your annotations from anywhere!

---

**Need help?** Check the `ANNOTATION_STORAGE_GUIDE.md` for more detailed information about the storage system.
