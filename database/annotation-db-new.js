const Database = require('better-sqlite3');
const path = require('path');

class AnnotationDatabase {
    constructor(dbPath = './annotations.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    init() {
        try {
            this.db = new Database(this.dbPath);
            console.log('✅ Connected to SQLite database');
            this.createTables();
        } catch (err) {
            console.error('Error opening database:', err);
            throw err;
        }
    }

    createTables() {
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

        try {
            this.db.exec(createAnnotationsTable);
            this.db.exec(createUsersTable);
            this.db.exec(createImagesTable);
            console.log('✅ Database tables created successfully');
        } catch (err) {
            console.error('Error creating tables:', err);
            throw err;
        }
    }

    saveAnnotation(annotationData) {
        const {
            imageId,
            userId,
            source,
            originalImage,
            annotationData: data,
            maskFilename
        } = annotationData;

        const insertAnnotation = this.db.prepare(`
            INSERT INTO annotations (image_id, user_id, source, original_image, annotation_data, mask_filename)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        try {
            const result = insertAnnotation.run(imageId, userId, source, originalImage, JSON.stringify(data), maskFilename);
            
            // Update user stats
            this.updateUserStats(userId);
            
            // Update image stats
            this.updateImageStats(imageId);
            
            console.log(`✅ Annotation saved with ID: ${result.lastInsertRowid}`);
            return result.lastInsertRowid;
        } catch (err) {
            console.error('Error saving annotation:', err);
            throw err;
        }
    }

    updateUserStats(userId) {
        const insertUser = this.db.prepare(`
            INSERT OR IGNORE INTO users (user_id, first_annotation, total_annotations) 
            VALUES (?, CURRENT_TIMESTAMP, 0)
        `);
        
        const updateUser = this.db.prepare(`
            UPDATE users 
            SET last_annotation = CURRENT_TIMESTAMP,
                total_annotations = total_annotations + 1
            WHERE user_id = ?
        `);

        try {
            insertUser.run(userId);
            updateUser.run(userId);
        } catch (err) {
            console.error('Error updating user stats:', err);
        }
    }

    updateImageStats(imageId) {
        const insertImage = this.db.prepare(`
            INSERT OR IGNORE INTO images (image_id, filename, source, annotation_count) 
            VALUES (?, ?, 'unknown', 0)
        `);
        
        const updateImage = this.db.prepare(`
            UPDATE images 
            SET annotation_count = annotation_count + 1
            WHERE image_id = ?
        `);

        try {
            insertImage.run(imageId, imageId);
            updateImage.run(imageId);
        } catch (err) {
            console.error('Error updating image stats:', err);
        }
    }

    getAllAnnotations(limit = 100) {
        const query = this.db.prepare(`
            SELECT 
                a.*,
                u.user_id,
                u.total_annotations as user_total_annotations
            FROM annotations a
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY a.created_at DESC
            LIMIT ?
        `);

        try {
            return query.all(limit);
        } catch (err) {
            console.error('Error getting annotations:', err);
            return [];
        }
    }

    getAnnotationsByUser(userId) {
        const query = this.db.prepare(`
            SELECT * FROM annotations 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `);

        try {
            return query.all(userId);
        } catch (err) {
            console.error('Error getting user annotations:', err);
            return [];
        }
    }

    getAnnotationsByImage(imageId) {
        const query = this.db.prepare(`
            SELECT * FROM annotations 
            WHERE image_id = ? 
            ORDER BY created_at DESC
        `);

        try {
            return query.all(imageId);
        } catch (err) {
            console.error('Error getting image annotations:', err);
            return [];
        }
    }

    getAnnotationStats() {
        const query = this.db.prepare(`
            SELECT 
                COUNT(*) as total_annotations,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT image_id) as annotated_images,
                COUNT(CASE WHEN source = 'test' THEN 1 END) as test_annotations,
                COUNT(CASE WHEN source = 'annotate' THEN 1 END) as direct_annotations
            FROM annotations
        `);

        try {
            return query.get() || {};
        } catch (err) {
            console.error('Error getting stats:', err);
            return {};
        }
    }

    getUserStats() {
        const query = this.db.prepare(`
            SELECT 
                user_id,
                total_annotations,
                first_annotation,
                last_annotation
            FROM users 
            ORDER BY total_annotations DESC
        `);

        try {
            return query.all();
        } catch (err) {
            console.error('Error getting user stats:', err);
            return [];
        }
    }

    exportAnnotations() {
        const query = this.db.prepare(`
            SELECT 
                a.*,
                u.total_annotations as user_total_annotations,
                i.annotation_count as image_total_annotations
            FROM annotations a
            LEFT JOIN users u ON a.user_id = u.user_id
            LEFT JOIN images i ON a.image_id = i.image_id
            ORDER BY a.created_at DESC
        `);

        try {
            return query.all();
        } catch (err) {
            console.error('Error exporting annotations:', err);
            return [];
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ Database connection closed');
        }
    }
}

module.exports = AnnotationDatabase;
