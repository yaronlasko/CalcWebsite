# 🔥 Firebase Setup Guide

This guide will help you set up Firebase remote storage for your calculus detection website annotations.

## Why Firebase?

Firebase provides:
- ✅ **Reliable remote storage** - Never lose annotations even when Render restarts
- ✅ **Easy external access** - View your backed up data from anywhere  
- ✅ **Real-time updates** - Annotations saved instantly to the cloud
- ✅ **Simple 0/1 mapping** - Clear binary mapping of annotation data
- ✅ **Web console access** - View and manage data through Firebase console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" 
3. Enter project name: `calculus-detection-backup`
4. Disable Google Analytics (not needed)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll configure security later)
4. Select a location close to your region
5. Click "Done"

## Step 3: Generate Service Account

1. Go to Project Settings (gear icon) → Service accounts
2. Click "Generate new private key"
3. Download the JSON file (keep it secure!)
4. The file looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-...@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Step 4: Configure Render Environment

1. Go to your Render dashboard
2. Click on your service
3. Go to "Environment"
4. Add new environment variable:
   - **Key**: `FIREBASE_CREDENTIALS`
   - **Value**: Paste the entire JSON content from step 3 (as one line)

⚠️ **Important**: The JSON must be on a single line when pasted into the environment variable.

## Step 5: Deploy and Test

1. Your Render service will automatically redeploy with Firebase
2. Visit your admin panel: `https://your-app.onrender.com/view`
3. You should see "🔥 Firebase Connected" 
4. Click "Test Firebase" to verify it's working
5. Visit the external viewer: `https://your-app.onrender.com/firebase-view`

## Step 6: View Your Data

### Option 1: Firebase Console
- Visit: `https://console.firebase.google.com/project/your-project-id/firestore`
- Browse collections: `annotations`, `users`, `images`

### Option 2: External Viewer
- Visit: `https://your-app.onrender.com/firebase-view`
- Real-time view of all annotations with stats

## Firebase Collections Structure

Your data will be organized in these collections:

### `annotations`
```javascript
{
  id: "unique-annotation-id",
  image_id: "image-filename",
  user_id: 123,
  timestamp: "2024-01-15T10:30:00Z",
  source: "test" | "annotate",
  original_image: "original-filename.jpg", 
  annotation_data: "{...json...}",
  mask_filename: "mask-filename.png",
  created_at: "firebase-timestamp",
  updated_at: "firebase-timestamp"
}
```

### `users` 
```javascript
{
  user_id: 123,
  first_annotation: "firebase-timestamp",
  last_annotation: "firebase-timestamp", 
  total_annotations: 5
}
```

### `images`
```javascript
{
  image_id: "filename.jpg",
  filename: "filename.jpg",
  source: "test" | "annotate",
  annotation_count: 3
}
```

## Security Notes

- Service account credentials give full access to your Firebase project
- Keep the JSON file secure and never commit it to version control
- Consider setting up Firestore security rules for production use
- The current setup allows read/write access for your application only

## Troubleshooting

### "Firebase not connected"
- Check that `FIREBASE_CREDENTIALS` environment variable is set
- Verify the JSON is valid and on a single line
- Check Render logs for Firebase initialization errors

### "Permission denied" errors
- Verify service account has Firestore permissions
- Check Firebase IAM roles for the service account

### Data not appearing
- Use "Test Firebase" button in admin panel
- Check Firebase console for data
- Verify Firestore rules allow writes

## Benefits Over Google Drive

✅ **Instant access** - No complex folder setup or permissions  
✅ **Real-time data** - See annotations immediately  
✅ **Structured data** - Clean JSON format, not file-based  
✅ **Built for apps** - Designed for web applications  
✅ **Better reliability** - No file system dependencies  
✅ **Easy queries** - Filter and search your data  

Your annotations will now be safely stored in Firebase and accessible from anywhere! 🎉
