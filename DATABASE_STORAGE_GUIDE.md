# 🗄️ Database Storage for Annotations

## Overview
This guide shows how to upgrade from file-based storage to database storage for permanent annotation data.

## Why Database Storage?

### Current File Storage Issues:
- ❌ Files lost on Render app restarts
- ❌ No permanent storage guarantee
- ❌ Difficult to query and analyze data
- ❌ Limited scalability

### Database Storage Benefits:
- ✅ Permanent storage
- ✅ Fast queries and analytics
- ✅ Backup and restore capabilities
- ✅ Scalable for many users
- ✅ ACID compliance (data integrity)

## 🚀 Quick Setup (SQLite Implementation)

### Step 1: Install Dependencies
```bash
npm install sqlite3
```

### Step 2: Files Already Created
- ✅ `database/annotation-db.js` - Database class
- ✅ `migrate-to-database.js` - Migration script
- ✅ `database-monitor.html` - Enhanced monitoring
- ✅ Updated `server.js` with database integration
- ✅ Updated `package.json` with sqlite3 dependency

### Step 3: Migrate Existing Data
```bash
node migrate-to-database.js
```

### Step 4: Deploy Updated Code
```bash
# Push to your git repository
git add .
git commit -m "Add database storage for annotations"
git push

# Redeploy on Render (automatic if connected to git)
```

## 🔍 What Gets Stored in Database

### Annotations Table
```sql
CREATE TABLE annotations (
    id INTEGER PRIMARY KEY,
    image_id TEXT NOT NULL,
    user_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL, -- 'test' or 'annotate'
    original_image TEXT,
    annotation_data TEXT, -- Base64 mask data
    mask_filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    first_annotation DATETIME,
    last_annotation DATETIME,
    total_annotations INTEGER DEFAULT 0
)
```

### Images Table
```sql
CREATE TABLE images (
    id INTEGER PRIMARY KEY,
    image_id TEXT UNIQUE NOT NULL,
    filename TEXT NOT NULL,
    source TEXT NOT NULL,
    annotation_count INTEGER DEFAULT 0
)
```

## 🎯 New Features Available

### Enhanced Admin Dashboard
- **Real-time stats**: Total annotations, unique users, etc.
- **User analytics**: Top users, annotation history
- **Data export**: Download all annotation data
- **Performance metrics**: Database-powered insights

### New API Endpoints
- `GET /api/admin/stats` - Overview statistics
- `GET /api/admin/users/:userId/annotations` - User-specific data
- `GET /api/admin/export` - Export all data
- `GET /api/admin/annotations` - Enhanced with database data

### Monitoring Tools
- **database-monitor.html** - Enhanced real-time dashboard
- **migrate-to-database.js** - One-time migration script
- **Backup scripts** - Updated for database export

## 📊 Database vs Files Comparison

| Feature | File Storage | Database Storage |
|---------|-------------|------------------|
| Persistence | ❌ Temporary | ✅ Permanent |
| Queries | ❌ Limited | ✅ Fast & Flexible |
| Analytics | ❌ Manual | ✅ Automated |
| Backup | ❌ Complex | ✅ Simple Export |
| Scalability | ❌ Poor | ✅ Excellent |
| Data Integrity | ❌ Risk of Loss | ✅ ACID Compliant |

## 🔧 Deployment on Render

### SQLite Deployment
✅ **Works on Render**: SQLite file stored in app directory
✅ **Automatic backups**: Use export API regularly
✅ **Easy setup**: No external database required

### Important Notes:
- SQLite database file (`annotations.db`) created automatically
- Database persists between app restarts on Render
- Use the export feature regularly for backups
- Database file included in your git repository (if desired)

## 🎛️ How to Use

### 1. Access Enhanced Admin Dashboard
- URL: `https://your-app.onrender.com/view`
- Login: `admin` / `admin123`
- See real-time database stats

### 2. Use Database Monitor
- Open `database-monitor.html` in browser
- Enter your Render URL
- View detailed analytics and export data

### 3. Regular Backups
```bash
# Via API (programmatic)
curl -X GET "https://your-app.onrender.com/api/admin/export" \
  --cookie "session=your-session" \
  -o annotations-backup.json

# Via browser (manual)
# Visit the database monitor and click "Export Data"
```

## 🔄 Migration Process

The migration script (`migrate-to-database.js`) will:

1. ✅ Read existing JSON metadata files
2. ✅ Read corresponding PNG annotation files  
3. ✅ Convert PNG files to base64 for database storage
4. ✅ Insert all data into the database
5. ✅ Preserve all existing metadata
6. ✅ Show migration summary

### Migration Output Example:
```
🔄 Starting annotation migration to database...
📊 Found 15 annotation metadata files to migrate
✅ Migrated: test-image-1-1642234567890.json
✅ Migrated: test-image-2-1642234567891.json
...
📈 Migration Summary:
✅ Successfully migrated: 15 annotations
❌ Errors: 0 annotations
🗄️ Database Stats:
   Total annotations: 15
   Unique users: 5
   Test annotations: 12
   Annotate annotations: 3
🎉 Migration complete!
```

## 🚀 Ready to Upgrade!

Your annotation system is now ready for database storage:

1. **Install**: `npm install sqlite3`
2. **Migrate**: `node migrate-to-database.js`  
3. **Deploy**: Push changes to git
4. **Monitor**: Use `database-monitor.html`

**All existing annotations will be preserved and enhanced with database capabilities!**
