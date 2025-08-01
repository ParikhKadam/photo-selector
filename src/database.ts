import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export interface StarredPhoto {
  id?: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dateStarred: string;
  lastModified: string;
}

export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // Create database in user's home directory for cross-platform compatibility
    const homeDir = os.homedir();
    const appDataDir = path.join(homeDir, '.photo-selector');
    
    // Ensure the app data directory exists
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    
    this.dbPath = path.join(appDataDir, 'photo-selector.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database at:', this.dbPath);
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS starred_photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_path TEXT UNIQUE NOT NULL,
          file_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_type TEXT NOT NULL,
          date_starred DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_modified DATETIME NOT NULL
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
          return;
        }
        
        console.log('Database tables created successfully');
        resolve();
      });
    });
  }

  async starPhoto(photo: Omit<StarredPhoto, 'id' | 'dateStarred'>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const insertSQL = `
        INSERT OR REPLACE INTO starred_photos 
        (file_path, file_name, file_size, file_type, last_modified)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(insertSQL, [
        photo.filePath,
        photo.fileName,
        photo.fileSize,
        photo.fileType,
        photo.lastModified
      ], function(err) {
        if (err) {
          console.error('Error starring photo:', err.message);
          reject(err);
          return;
        }
        
        console.log('Photo starred successfully:', photo.fileName);
        resolve(true);
      });
    });
  }

  async unstarPhoto(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const deleteSQL = 'DELETE FROM starred_photos WHERE file_path = ?';

      this.db.run(deleteSQL, [filePath], function(err) {
        if (err) {
          console.error('Error unstarring photo:', err.message);
          reject(err);
          return;
        }
        
        console.log('Photo unstarred successfully:', filePath);
        resolve(true);
      });
    });
  }

  async isPhotoStarred(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const selectSQL = 'SELECT COUNT(*) as count FROM starred_photos WHERE file_path = ?';

      this.db.get(selectSQL, [filePath], (err, row: any) => {
        if (err) {
          console.error('Error checking if photo is starred:', err.message);
          reject(err);
          return;
        }
        
        resolve(row.count > 0);
      });
    });
  }

  async getStarredPhotos(): Promise<StarredPhoto[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const selectSQL = `
        SELECT 
          id,
          file_path as filePath,
          file_name as fileName,
          file_size as fileSize,
          file_type as fileType,
          date_starred as dateStarred,
          last_modified as lastModified
        FROM starred_photos 
        ORDER BY date_starred DESC
      `;

      this.db.all(selectSQL, (err, rows: any[]) => {
        if (err) {
          console.error('Error getting starred photos:', err.message);
          reject(err);
          return;
        }
        
        resolve(rows as StarredPhoto[]);
      });
    });
  }

  async getStarredPhotosByPaths(filePaths: string[]): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
      if (!this.db || filePaths.length === 0) {
        resolve(new Set());
        return;
      }

      const placeholders = filePaths.map(() => '?').join(',');
      const selectSQL = `SELECT file_path FROM starred_photos WHERE file_path IN (${placeholders})`;

      this.db.all(selectSQL, filePaths, (err, rows: any[]) => {
        if (err) {
          console.error('Error getting starred photos by paths:', err.message);
          reject(err);
          return;
        }
        
        const starredPaths = new Set(rows.map(row => row.file_path));
        resolve(starredPaths);
      });
    });
  }

  async cleanupNonExistentFiles(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // First, get all starred photos
      this.getStarredPhotos().then(async (starredPhotos) => {
        let removedCount = 0;
        
        for (const photo of starredPhotos) {
          try {
            // Check if file still exists
            await fs.promises.access(photo.filePath, fs.constants.F_OK);
          } catch (error) {
            // File doesn't exist, remove from database
            try {
              await this.unstarPhoto(photo.filePath);
              removedCount++;
            } catch (deleteError) {
              console.error('Error removing non-existent file from database:', deleteError);
            }
          }
        }
        
        resolve(removedCount);
      }).catch(reject);
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
          return;
        }
        
        console.log('Database connection closed');
        this.db = null;
        resolve();
      });
    });
  }
}
