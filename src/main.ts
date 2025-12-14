import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseManager, StarredPhoto } from './database';
import { ThumbnailService } from './thumbnail';

class PhotoSelectorApp {
  private mainWindow: BrowserWindow | null = null;
  private dbManager: DatabaseManager;
  private thumbnailService: ThumbnailService;

  constructor() {
    this.dbManager = new DatabaseManager();
    this.thumbnailService = new ThumbnailService();
    this.init();
  }

  private init(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(async () => {
      // Initialize database
      try {
        await this.dbManager.initialize();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }

      this.createWindow();
      this.setupMenu();
      this.setupIpcHandlers();

      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', async () => {
      // Close database connection
      try {
        await this.dbManager.close();
      } catch (error) {
        console.error('Error closing database:', error);
      }

      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createWindow(): void {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../assets/icon.png'), // We'll create this later
      show: false // Don't show until ready-to-show
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Folder',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow!, {
                properties: ['openDirectory'],
                title: 'Select Photo Folder'
              });

              if (!result.canceled && result.filePaths.length > 0) {
                this.mainWindow?.webContents.send('folder-selected', result.filePaths[0]);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'View Starred Photos',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => {
              this.mainWindow?.webContents.send('show-starred-photos');
            }
          },
          {
            label: 'Back to Home',
            accelerator: 'CmdOrCtrl+H',
            click: () => {
              this.mainWindow?.webContents.send('go-back-home');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Handle folder selection dialog
    ipcMain.handle('dialog:openFolder', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory'],
        title: 'Select Photo Folder'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }

      return undefined;
    });

    // Handle getting files from a folder
    ipcMain.handle('folder:getMediaFiles', async (event, folderPath: string) => {
      try {
        return await this.getMediaFiles(folderPath);
      } catch (error) {
        console.error('Error reading folder:', error);
        return [];
      }
    });

    // Handle getting files from a folder with pagination
    ipcMain.handle('folder:getMediaFilesPaginated', async (event, folderPath: string, offset: number = 0, limit: number = 50) => {
      try {
        const allFiles = await this.getMediaFiles(folderPath);
        const paginatedFiles = allFiles.slice(offset, offset + limit);
        return {
          files: paginatedFiles,
          total: allFiles.length,
          hasMore: offset + limit < allFiles.length
        };
      } catch (error) {
        console.error('Error reading folder:', error);
        return { files: [], total: 0, hasMore: false };
      }
    });

    // Handle image preview
    ipcMain.handle('image:getPreview', async (event, filePath: string) => {
      try {
        // For images, we'll return the file path for direct access
        // Electron can handle file:// protocol for local files
        return {
          success: true,
          filePath: filePath,
          exists: await this.fileExists(filePath)
        };
      } catch (error) {
        console.error('Error getting image preview:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle thumbnail generation
    ipcMain.handle('image:getThumbnail', async (event, filePath: string) => {
      try {
        const result = await this.thumbnailService.getThumbnail(filePath);
        return result;
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle batch thumbnail generation
    ipcMain.handle('image:getThumbnails', async (event, filePaths: string[]) => {
      try {
        const results = await this.thumbnailService.getThumbnails(filePaths);
        // Convert Map to object for IPC transfer
        const resultsObj: { [key: string]: any } = {};
        results.forEach((value, key) => {
          resultsObj[key] = value;
        });
        return { success: true, thumbnails: resultsObj };
      } catch (error) {
        console.error('Error generating batch thumbnails:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle starring a photo
    ipcMain.handle('star:addPhoto', async (event, photoData: Omit<StarredPhoto, 'id' | 'dateStarred'>) => {
      try {
        const result = await this.dbManager.starPhoto(photoData);
        return { success: result };
      } catch (error) {
        console.error('Error starring photo:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle unstarring a photo
    ipcMain.handle('star:removePhoto', async (event, filePath: string) => {
      try {
        const result = await this.dbManager.unstarPhoto(filePath);
        return { success: result };
      } catch (error) {
        console.error('Error unstarring photo:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle checking if a photo is starred
    ipcMain.handle('star:isPhotoStarred', async (event, filePath: string) => {
      try {
        const isStarred = await this.dbManager.isPhotoStarred(filePath);
        return { success: true, isStarred };
      } catch (error) {
        console.error('Error checking if photo is starred:', error);
        return {
          success: false,
          isStarred: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle getting all starred photos
    ipcMain.handle('star:getStarredPhotos', async () => {
      try {
        const starredPhotos = await this.dbManager.getStarredPhotos();
        return { success: true, photos: starredPhotos };
      } catch (error) {
        console.error('Error getting starred photos:', error);
        return {
          success: false,
          photos: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle getting starred status for multiple photos
    ipcMain.handle('star:getStarredPhotosByPaths', async (event, filePaths: string[]) => {
      try {
        const starredPaths = await this.dbManager.getStarredPhotosByPaths(filePaths);
        return { success: true, starredPaths: Array.from(starredPaths) };
      } catch (error) {
        console.error('Error getting starred photos by paths:', error);
        return {
          success: false,
          starredPaths: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle cleanup of non-existent files
    ipcMain.handle('star:cleanupNonExistentFiles', async () => {
      try {
        const removedCount = await this.dbManager.cleanupNonExistentFiles();
        return { success: true, removedCount };
      } catch (error) {
        console.error('Error cleaning up non-existent files:', error);
        return {
          success: false,
          removedCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle export folder selection
    ipcMain.handle('dialog:selectExportFolder', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Export Destination Folder'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }

      return undefined;
    });

    // Handle exporting starred photos
    ipcMain.handle('export:starredPhotos', async (event, exportPath: string) => {
      try {
        const starredPhotos = await this.dbManager.getStarredPhotos();
        const results = await this.exportPhotos(starredPhotos, exportPath);
        return { success: true, results };
      } catch (error) {
        console.error('Error exporting starred photos:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Handle thumbnail cache cleanup
    ipcMain.handle('thumbnail:cleanup', async () => {
      try {
        await this.thumbnailService.cleanupCache();
        return { success: true };
      } catch (error) {
        console.error('Error cleaning up thumbnail cache:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async getMediaFiles(folderPath: string): Promise<Array<{ name: string, path: string, type: string, size: number, lastModified: Date, isDirectory?: boolean }>> {
    const supportedExtensions = new Set([
      // Image formats
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif',
      // Video formats
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
    ]);

    const items: Array<{ name: string, path: string, type: string, size: number, lastModified: Date, isDirectory?: boolean }> = [];

    try {
      const dirItems = await fs.promises.readdir(folderPath, { withFileTypes: true });

      // First, collect directories
      for (const item of dirItems) {
        if (item.isDirectory()) {
          const dirPath = path.join(folderPath, item.name);
          try {
            const stats = await fs.promises.stat(dirPath);
            items.push({
              name: item.name,
              path: dirPath,
              type: 'folder',
              size: 0, // Directories don't have a meaningful size
              lastModified: stats.mtime,
              isDirectory: true
            });
          } catch (error) {
            console.warn(`Could not stat directory ${dirPath}:`, error);
          }
        }
      }

      // Then, collect files
      for (const item of dirItems) {
        if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (supportedExtensions.has(ext)) {
            const filePath = path.join(folderPath, item.name);
            const stats = await fs.promises.stat(filePath);

            const type = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'].includes(ext)
              ? 'image'
              : 'video';

            items.push({
              name: item.name,
              path: filePath,
              type: type,
              size: stats.size,
              lastModified: stats.mtime,
              isDirectory: false
            });
          }
        }
      }

      // Sort items: directories first, then files, both alphabetically
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    } catch (error) {
      console.error('Error reading directory:', error);
    }

    return items;
  }

  private async exportPhotos(starredPhotos: StarredPhoto[], exportPath: string): Promise<{
    exported: number;
    failed: number;
    errors: string[];
  }> {
    let exported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const photo of starredPhotos) {
      try {
        // Check if source file exists
        const sourceExists = await this.fileExists(photo.filePath);
        if (!sourceExists) {
          failed++;
          errors.push(`Source file not found: ${photo.fileName}`);
          continue;
        }

        // Create destination path
        const destPath = path.join(exportPath, photo.fileName);

        // Handle duplicate filenames by appending a number
        let finalDestPath = destPath;
        let counter = 1;
        while (await this.fileExists(finalDestPath)) {
          const ext = path.extname(photo.fileName);
          const nameWithoutExt = path.basename(photo.fileName, ext);
          finalDestPath = path.join(exportPath, `${nameWithoutExt}_${counter}${ext}`);
          counter++;
        }

        // Copy the file
        await fs.promises.copyFile(photo.filePath, finalDestPath);
        exported++;
        console.log(`Exported: ${photo.fileName} -> ${path.basename(finalDestPath)}`);

      } catch (error) {
        failed++;
        const errorMsg = `Failed to export ${photo.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { exported, failed, errors };
  }
}

// Create app instance
new PhotoSelectorApp();
