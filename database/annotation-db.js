const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class AnnotationDatabase {
    constructor(dbPath = './annotations.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createAnnotationsTable = `
                CREATE TABLE IF NOT EXISTS annotations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image_id TEXT NOT NULL,
                    user_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    source TEXT NOT NULL CHECK(source IN ('test', 'annotate')),
                    original_image TEXT,
                    annotation_data TEXT,
                    mask_filename TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    first_annotation DATETIME,
                    last_annotation DATETIME,
                    total_annotations INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createImagesTable = `
                CREATE TABLE IF NOT EXISTS images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image_id TEXT UNIQUE NOT NULL,
                    filename TEXT NOT NULL,
                    source TEXT NOT NULL CHECK(source IN ('test', 'annotate')),
                    annotation_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.serialize(() => {
                this.db.run(createAnnotationsTable);
                this.db.run(createUsersTable);
                this.db.run(createImagesTable, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('✅ Database tables created successfully');
                        resolve();
                    }
                });
            });
        });
    }

    async saveAnnotation(annotationData) {
        return new Promise((resolve, reject) => {
            const {
                imageId,
                userId,
                source,
                originalImage,
                maskData,
                maskFilename
            } = annotationData;

            const query = `
                INSERT INTO annotations (
                    image_id, user_id, source, original_image, 
                    annotation_data, mask_filename
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            this.db.run(query, [
                imageId,
                userId || 'anonymous',
                source,
                originalImage,
                maskData, // Store base64 data or file reference
                maskFilename
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Update user statistics
                    this.updateUserStats(userId);
                    // Update image statistics
                    this.updateImageStats(imageId);
                    
                    resolve({
                        id: this.lastID,
                        imageId,
                        userId,
                        timestamp: new Date().toISOString()
                    });
                }
            }.bind(this));
        });
    }

    async updateUserStats(userId) {
        if (!userId || userId === 'anonymous') return;

        return new Promise((resolve, reject) => {
            const upsertQuery = `
                INSERT INTO users (user_id, first_annotation, last_annotation, total_annotations)
                VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
                ON CONFLICT(user_id) DO UPDATE SET
                    last_annotation = CURRENT_TIMESTAMP,
                    total_annotations = total_annotations + 1
            `;

            this.db.run(upsertQuery, [userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async updateImageStats(imageId) {
        return new Promise((resolve, reject) => {
            const updateQuery = `
                UPDATE images 
                SET annotation_count = annotation_count + 1 
                WHERE image_id = ?
            `;

            this.db.run(updateQuery, [imageId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async getAllAnnotations(limit = 100) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM annotations 
                ORDER BY created_at DESC 
                LIMIT ?
            `;

            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getAnnotationsByUser(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM annotations 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `;

            this.db.all(query, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getAnnotationsByImage(imageId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM annotations 
                WHERE image_id = ? 
                ORDER BY created_at DESC
            `;

            this.db.all(query, [imageId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getAnnotationStats() {
        return new Promise((resolve, reject) => {
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_annotations,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT image_id) as annotated_images,
                    SUM(CASE WHEN source = 'test' THEN 1 ELSE 0 END) as test_annotations,
                    SUM(CASE WHEN source = 'annotate' THEN 1 ELSE 0 END) as annotate_annotations
                FROM annotations
            `;

            this.db.get(statsQuery, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getUserStats() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    user_id,
                    total_annotations,
                    first_annotation,
                    last_annotation
                FROM users 
                ORDER BY total_annotations DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async exportAnnotations() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    a.*,
                    u.total_annotations as user_total_annotations
                FROM annotations a
                LEFT JOIN users u ON a.user_id = u.user_id
                ORDER BY a.created_at DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('✅ Database connection closed');
                }
            });
        }
    }
}

module.exports = AnnotationDatabase;
