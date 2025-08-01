import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  getMediaFiles: (folderPath: string) => ipcRenderer.invoke('folder:getMediaFiles', folderPath),
  getImagePreview: (filePath: string) => ipcRenderer.invoke('image:getPreview', filePath),
  onFolderSelected: (callback: (folderPath: string) => void) => 
    ipcRenderer.on('folder-selected', (_event, folderPath) => callback(folderPath)),
  removeAllListeners: (channel: string) => 
    ipcRenderer.removeAllListeners(channel),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      openFolder: () => Promise<string | undefined>;
      getMediaFiles: (folderPath: string) => Promise<Array<{name: string, path: string, type: string, size: number, lastModified: Date}>>;
      getImagePreview: (filePath: string) => Promise<{success: boolean, filePath?: string, exists?: boolean, error?: string}>;
      onFolderSelected: (callback: (folderPath: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
