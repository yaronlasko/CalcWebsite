# 📋 HOW TO GET YOUR ANNOTATIONS

## 🎯 **5 Ways to Access Your Annotations**

### **1. 🖥️ Admin Dashboard (Built-in)**
**Best for: Quick overview and management**
- **URL**: `https://your-app.onrender.com/view`
- **Login**: `admin` / `admin123`
- **Features**:
  - View all annotations by user
  - Click images to see individual annotations
  - Real-time statistics
  - User activity tracking

### **2. 📊 Database Monitor (Enhanced)**
**Best for: Detailed analytics**
- **File**: `database-monitor.html` (open in browser)
- **Features**:
  - Real-time statistics
  - Top users leaderboard
  - Auto-refresh capabilities
  - Data export functionality

### **3. 📋 Annotation Viewer (New!)**
**Best for: Browsing and searching annotations**
- **File**: `annotation-viewer.html` (open in browser)
- **Features**:
  - Grid view of all annotations
  - Search by user or image name
  - Filter by source (test vs annotate)
  - Click images to view full size
  - Export functionality

### **4. 💻 Command Line Script**
**Best for: Quick terminal access**
```bash
node get-annotations.js
```
**Output**:
- Overview statistics
- User statistics
- Recent annotations
- Top user details

### **5. 🔌 API Endpoints**
**Best for: Programmatic access**

#### Get All Annotations:
```bash
curl -X GET "https://your-app.onrender.com/api/admin/annotations" \
  -u admin:admin123 --cookie-jar cookies.txt
```

#### Get Statistics:
```bash
curl -X GET "https://your-app.onrender.com/api/admin/stats" \
  -u admin:admin123 --cookie-jar cookies.txt
```

#### Export All Data:
```bash
curl -X GET "https://your-app.onrender.com/api/admin/export" \
  -u admin:admin123 --cookie-jar cookies.txt \
  -o annotations-backup.json
```

## 📊 **What Data You Get**

### **Each Annotation Contains:**
```json
{
  "id": 123,
  "imageId": "test-image-1",
  "userId": "5",
  "timestamp": "2025-08-14T10:30:00.000Z",
  "source": "test",
  "originalImage": "DSC_5665.JPG",
  "filename": "test-image-1-1692345600000.png",
  "path": "/uploads/annotations/test-image-1-1692345600000.png"
}
```

### **Statistics Include:**
- Total annotation count
- Unique user count
- Test vs annotate breakdown
- User activity patterns
- Most annotated images

## 🚀 **Quick Start Guide**

### **For Visual Access (Recommended):**
1. Open `annotation-viewer.html` in your browser
2. Enter your Render URL: `https://your-app.onrender.com`
3. Click "Load Annotations"
4. Browse, search, and filter your data

### **For Command Line Access:**
```bash
# Install dependencies (if not done)
npm install sqlite3

# View annotations
node get-annotations.js
```

### **For API Access:**
1. First authenticate via admin login
2. Use the API endpoints with session cookies
3. Export data for backup/analysis

## 📈 **Data Analysis Examples**

### **Find Most Active Users:**
```javascript
// In annotation-viewer.html or via API
// Sort users by annotation count
// See who's contributing most
```

### **Track Daily Activity:**
```javascript
// Group annotations by date
// See usage patterns over time
// Identify peak usage periods
```

### **Image Popularity:**
```javascript
// Count annotations per image
// Find which images get annotated most
// Identify challenging images
```

## 💾 **Backup & Export**

### **Regular Backups:**
1. Use the export feature in any dashboard
2. Downloads JSON file with all data
3. Includes annotation metadata and statistics

### **Automated Backups:**
```bash
# Set up a cron job or scheduled task
curl -X GET "https://your-app.onrender.com/api/admin/export" \
  -u admin:admin123 \
  -o "backup-$(date +%Y-%m-%d).json"
```

## ⚡ **Quick Access Summary**

| Method | Best For | Time | Features |
|--------|----------|------|----------|
| Admin Dashboard | Quick overview | 30 seconds | Built-in, real-time |
| Annotation Viewer | Browsing/searching | 1 minute | Visual, searchable |
| Database Monitor | Analytics | 1 minute | Statistics, export |
| Command Line | Terminal users | 30 seconds | Fast, scriptable |
| API | Automation | Variable | Programmable |

## 🎯 **Recommended Workflow**

1. **Daily Monitoring**: Use Admin Dashboard
2. **Data Analysis**: Use Database Monitor  
3. **Detailed Review**: Use Annotation Viewer
4. **Backups**: Use Export features
5. **Automation**: Use API endpoints

**All your annotations are now easily accessible and permanently stored!** 🎉
