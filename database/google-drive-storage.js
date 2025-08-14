const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveStorage {
    constructor() {
        this.drive = null;
        this.folderId = null;
        this.isInitialized = false;
        
        // File names for different data types
        this.files = {
            annotations: 'annotations.json',
            users: 'users.json',
            images: 'images.json'
        };
        
        this.init();
    }

    async init() {
        try {
            // Check if we have Google credentials
            const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';
            const credentials = process.env.GOOGLE_CREDENTIALS || null;
            
            let auth;
            
            if (credentials) {
                // Use credentials from environment variable (for production)
                const credentialsObj = JSON.parse(credentials);
                auth = new google.auth.GoogleAuth({
                    credentials: credentialsObj,
                    scopes: ['https://www.googleapis.com/auth/drive.file']
                });
            } else if (fs.existsSync(credentialsPath)) {
                // Use credentials file (for development)
                auth = new google.auth.GoogleAuth({
                    keyFile: credentialsPath,
                    scopes: ['https://www.googleapis.com/auth/drive.file']
                });
            } else {
                console.log('⚠️  Google Drive credentials not found - using local storage only');
                return;
            }

            this.drive = google.drive({ version: 'v3', auth });
            
            // Create or find the application folder
            await this.ensureAppFolder();
            this.isInitialized = true;
            
            console.log('✅ Google Drive storage initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Google Drive:', error.message);
            console.log('📁 Falling back to local storage only');
        }
    }

    async ensureAppFolder() {
        if (!this.drive) return;
        
        try {
            // Search for existing folder
            const folderName = 'CalcWebsite-Annotations';
            const response = await this.drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
                spaces: 'drive'
            });

            if (response.data.files.length > 0) {
                this.folderId = response.data.files[0].id;
                console.log(`📁 Found existing folder: ${folderName}`);
                
                // Ensure permissions are set for existing folder
                await this.ensureFolderPermissions();
            } else {
                // Create new folder
                const folderResponse = await this.drive.files.create({
                    resource: {
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder'
                    }
                });
                this.folderId = folderResponse.data.id;
                console.log(`📁 Created new folder: ${folderName}`);
                
                // Set permissions for the new folder
                await this.ensureFolderPermissions();
            }
            
            // Get the shareable link
            try {
                const folderInfo = await this.drive.files.get({
                    fileId: this.folderId,
                    fields: 'webViewLink,name'
                });
                
                if (folderInfo.data.webViewLink) {
                    console.log(`🔗 Folder accessible at: ${folderInfo.data.webViewLink}`);
                    this.folderLink = folderInfo.data.webViewLink;
                }
            } catch (linkError) {
                console.log('📁 Folder created but link not accessible');
            }
            
        } catch (error) {
            console.error('❌ Error managing Drive folder:', error.message);
            throw error;
        }
    }

    async ensureFolderPermissions() {
        if (!this.drive || !this.folderId) return;

        const emailsToGrantAccess = [
            'lasko.yaron@gmail.com',
            'toothsegproject@gmail.com'
        ];

        try {
            // First, make folder publicly viewable with link
            try {
                await this.drive.permissions.create({
                    fileId: this.folderId,
                    resource: {
                        role: 'reader',
                        type: 'anyone'
                    }
                });
                console.log(`🌐 Folder made publicly viewable with link`);
            } catch (publicError) {
                console.log('⚠️ Could not make folder publicly viewable:', publicError.message);
            }

            // Grant specific email permissions
            for (const email of emailsToGrantAccess) {
                try {
                    await this.drive.permissions.create({
                        fileId: this.folderId,
                        resource: {
                            role: 'writer',  // Editor access
                            type: 'user',
                            emailAddress: email
                        }
                    });
                    console.log(`✅ Granted editor access to ${email}`);
                } catch (permError) {
                    console.log(`⚠️ Could not grant access to ${email}:`, permError.message);
                    // Continue with other emails even if one fails
                }
            }

        } catch (error) {
            console.error('❌ Error setting folder permissions:', error.message);
            // Don't throw error - folder creation should still work
        }
    }

    // Method to fix permissions for existing folders
    async fixFolderPermissions() {
        if (!this.drive || !this.folderId) {
            console.log('❌ Drive not initialized or folder not found');
            return false;
        }

        console.log('🔧 Fixing folder permissions...');
        await this.ensureFolderPermissions();
        console.log('✅ Folder permissions update completed');
        return true;
    }

    async uploadFile(filename, data) {
        if (!this.isInitialized || !this.drive) {
            console.log(`⚠️  Drive not available - skipping upload of ${filename}`);
            return null;
        }

        try {
            const fileContent = JSON.stringify(data, null, 2);
            
            // Check if file already exists
            const existingFiles = await this.drive.files.list({
                q: `name='${filename}' and parents='${this.folderId}'`,
                spaces: 'drive'
            });

            const media = {
                mimeType: 'application/json',
                body: fileContent
            };

            if (existingFiles.data.files.length > 0) {
                // Update existing file
                const fileId = existingFiles.data.files[0].id;
                await this.drive.files.update({
                    fileId: fileId,
                    media: media
                });
                console.log(`📤 Updated ${filename} in Google Drive`);
            } else {
                // Create new file
                await this.drive.files.create({
                    resource: {
                        name: filename,
                        parents: [this.folderId]
                    },
                    media: media
                });
                console.log(`📤 Created ${filename} in Google Drive`);
            }

            return true;
        } catch (error) {
            console.error(`❌ Error uploading ${filename}:`, error.message);
            return false;
        }
    }

    async downloadFile(filename, defaultData = null) {
        if (!this.isInitialized || !this.drive) {
            return defaultData;
        }

        try {
            // Find the file
            const files = await this.drive.files.list({
                q: `name='${filename}' and parents='${this.folderId}'`,
                spaces: 'drive'
            });

            if (files.data.files.length === 0) {
                console.log(`📄 File ${filename} not found in Drive - using default data`);
                return defaultData;
            }

            const fileId = files.data.files[0].id;
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            const data = JSON.parse(response.data);
            console.log(`📥 Downloaded ${filename} from Google Drive`);
            return data;
        } catch (error) {
            console.error(`❌ Error downloading ${filename}:`, error.message);
            return defaultData;
        }
    }

    async syncAnnotations(annotations) {
        return await this.uploadFile(this.files.annotations, annotations);
    }

    async syncUsers(users) {
        return await this.uploadFile(this.files.users, users);
    }

    async syncImages(images) {
        return await this.uploadFile(this.files.images, images);
    }

    async loadAnnotations() {
        return await this.downloadFile(this.files.annotations, []);
    }

    async loadUsers() {
        return await this.downloadFile(this.files.users, {});
    }

    async loadImages() {
        return await this.downloadFile(this.files.images, {});
    }

    // Backup all data
    async backupAll(annotations, users, images) {
        if (!this.isInitialized) return false;
        
        const results = await Promise.all([
            this.syncAnnotations(annotations),
            this.syncUsers(users),
            this.syncImages(images)
        ]);

        return results.every(result => result !== false);
    }

    // Restore all data
    async restoreAll() {
        if (!this.isInitialized) {
            return {
                annotations: [],
                users: {},
                images: {}
            };
        }

        const [annotations, users, images] = await Promise.all([
            this.loadAnnotations(),
            this.loadUsers(),
            this.loadImages()
        ]);

        return { annotations, users, images };
    }
    
    // Get folder information for external access
    async getFolderInfo() {
        if (!this.isInitialized || !this.drive) {
            return null;
        }
        
        try {
            const folderInfo = await this.drive.files.get({
                fileId: this.folderId,
                fields: 'webViewLink,name,createdTime,modifiedTime'
            });
            
            // Get list of files in folder
            const files = await this.drive.files.list({
                q: `parents='${this.folderId}'`,
                fields: 'files(name,createdTime,modifiedTime,size,webViewLink)'
            });

            // Get permissions info
            let permissions = [];
            try {
                const permissionsResponse = await this.drive.permissions.list({
                    fileId: this.folderId,
                    fields: 'permissions(emailAddress,role,type)'
                });
                permissions = permissionsResponse.data.permissions || [];
            } catch (permError) {
                console.log('Could not retrieve permissions info:', permError.message);
            }
            
            return {
                folder: {
                    name: folderInfo.data.name,
                    link: folderInfo.data.webViewLink,
                    created: folderInfo.data.createdTime,
                    modified: folderInfo.data.modifiedTime,
                    permissions: permissions
                },
                files: files.data.files.map(file => ({
                    name: file.name,
                    size: file.size,
                    created: file.createdTime,
                    modified: file.modifiedTime,
                    link: file.webViewLink
                }))
            };
        } catch (error) {
            console.error('❌ Error getting folder info:', error.message);
            return null;
        }
    }
}

module.exports = GoogleDriveStorage;
