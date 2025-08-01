import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

class PhotoSelectorApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
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
    app.on('window-all-closed', () => {
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
