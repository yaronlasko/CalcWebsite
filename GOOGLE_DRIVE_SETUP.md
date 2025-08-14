# Google Drive Integration Setup Guide

## 📋 Overview
This guide will help you set up Google Drive API integration to automatically backup and restore your annotation data, preventing data loss when Render restarts your application.

## 🔧 Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable the Google Drive API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## 🔑 Step 2: Create Service Account

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "Service Account"**
3. **Fill in the details**:
   - Service account name: `calcwebsite-drive-access`
   - Service account ID: `calcwebsite-drive-access`
   - Description: `Service account for CalcWebsite annotation backup`
4. **Click "Create and Continue"**
5. **Grant permissions** (skip this step, click "Continue")
6. **Click "Done"**

## 📁 Step 3: Generate Credentials File

1. **Find your new service account** in the credentials list
2. **Click on the service account email**
3. **Go to the "Keys" tab**
4. **Click "Add Key" > "Create New Key"**
5. **Select "JSON" format**
6. **Click "Create"** - This will download a JSON file

## 🔒 Step 4: Set Up Credentials (Choose One Method)

### Method A: For Development (Local Testing)
1. **Rename the downloaded file** to `google-credentials.json`
2. **Place it in your project root** (same folder as `server.js`)
3. **Add to .gitignore** (already done):
   ```
   google-credentials.json
   ```

### Method B: For Production (Render Deployment)
1. **Open the downloaded JSON file**
2. **Copy the entire JSON content**
3. **In Render Dashboard**:
   - Go to your app settings
   - Add environment variable:
     - **Name**: `GOOGLE_CREDENTIALS`
     - **Value**: (paste the entire JSON content)

## 📂 Step 5: Test the Integration

Once credentials are set up, your app will:

1. **Automatically create** a folder called `CalcWebsite-Annotations` in the service account's Google Drive
2. **Backup data** every time a new annotation is created
3. **Restore data** when the server starts (useful after Render restarts)

## 🧪 Testing Endpoints

### Check Google Drive Status
```
GET /api/admin/drive-status
```

### Manual Sync to Google Drive
```
POST /api/admin/sync-drive
```

## 📊 What Gets Backed Up

- **annotations.json** - All user annotations
- **users.json** - User statistics and data
- **images.json** - Image metadata and stats

## ⚠️ Important Notes

1. **Service Account Access**: The service account has its own Google Drive space
2. **Data Privacy**: Only your application can access the backup data
3. **Automatic Sync**: Data is synced every time an annotation is saved
4. **Fallback**: If Google Drive is unavailable, the app continues working with local storage

## 🔧 Troubleshooting

### "Drive not available"
- Check that credentials are properly set
- Verify Google Drive API is enabled
- Check Render logs for specific error messages

### "Folder creation failed"  
- Verify service account has proper permissions
- Check Google Cloud Console for API quotas

## 🎯 Next Steps

After setup:
1. Deploy to Render with environment variables
2. Test annotation creation
3. Check admin panel for Google Drive status
4. Verify data persists after server restarts

---

**Need help?** Check the server logs for detailed error messages starting with "Google Drive" or "Drive Storage".
