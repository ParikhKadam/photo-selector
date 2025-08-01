import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseManager, StarredPhoto } from './database';

class PhotoSelectorApp {
  private mainWindow: BrowserWindow | null = null;
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = new DatabaseManager();
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
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async getMediaFiles(folderPath: string): Promise<Array<{name: string, path: string, type: string, size: number, lastModified: Date}>> {
    const supportedExtensions = new Set([
      // Image formats
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif',
      // Video formats
      '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'
    ]);

    const files: Array<{name: string, path: string, type: string, size: number, lastModified: Date}> = [];
    
    try {
      const items = await fs.promises.readdir(folderPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (supportedExtensions.has(ext)) {
            const filePath = path.join(folderPath, item.name);
            const stats = await fs.promises.stat(filePath);
            
            const type = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'].includes(ext) 
              ? 'image' 
              : 'video';
            
            files.push({
              name: item.name,
              path: filePath,
              type: type,
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        }
      }
      
      // Sort files by name
      files.sort((a, b) => a.name.localeCompare(b.name));
      
    } catch (error) {
      console.error('Error reading directory:', error);
    }
    
    return files;
  }
}

// Create app instance
new PhotoSelectorApp();
