import { contextBridge, ipcRenderer } from 'electron';

interface StarredPhoto {
  id?: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dateStarred: string;
  lastModified: string;
}

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
  
  // Star/shortlist functionality
  starPhoto: (photoData: Omit<StarredPhoto, 'id' | 'dateStarred'>) => 
    ipcRenderer.invoke('star:addPhoto', photoData),
  unstarPhoto: (filePath: string) => 
    ipcRenderer.invoke('star:removePhoto', filePath),
  isPhotoStarred: (filePath: string) => 
    ipcRenderer.invoke('star:isPhotoStarred', filePath),
  getStarredPhotos: () => 
    ipcRenderer.invoke('star:getStarredPhotos'),
  getStarredPhotosByPaths: (filePaths: string[]) => 
    ipcRenderer.invoke('star:getStarredPhotosByPaths', filePaths),
  cleanupNonExistentFiles: () => 
    ipcRenderer.invoke('star:cleanupNonExistentFiles'),
  onShowStarredPhotos: (callback: () => void) => 
    ipcRenderer.on('show-starred-photos', callback),
  
  // Export functionality
  selectExportFolder: () => 
    ipcRenderer.invoke('dialog:selectExportFolder'),
  exportStarredPhotos: (exportPath: string) => 
    ipcRenderer.invoke('export:starredPhotos', exportPath),
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
      
      // Star/shortlist functionality
      starPhoto: (photoData: Omit<StarredPhoto, 'id' | 'dateStarred'>) => Promise<{success: boolean, error?: string}>;
      unstarPhoto: (filePath: string) => Promise<{success: boolean, error?: string}>;
      isPhotoStarred: (filePath: string) => Promise<{success: boolean, isStarred: boolean, error?: string}>;
      getStarredPhotos: () => Promise<{success: boolean, photos: StarredPhoto[], error?: string}>;
      getStarredPhotosByPaths: (filePaths: string[]) => Promise<{success: boolean, starredPaths: string[], error?: string}>;
      cleanupNonExistentFiles: () => Promise<{success: boolean, removedCount: number, error?: string}>;
      onShowStarredPhotos: (callback: () => void) => void;
      
      // Export functionality
      selectExportFolder: () => Promise<string | undefined>;
      exportStarredPhotos: (exportPath: string) => Promise<{success: boolean, results?: {exported: number, failed: number, errors: string[]}, error?: string}>;
    };
  }
}
