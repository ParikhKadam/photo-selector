import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';
import { app } from 'electron';

export interface ThumbnailResult {
  success: boolean;
  thumbnailPath?: string;
  error?: string;
}

export class ThumbnailService {
  private thumbnailCacheDir: string;
  private readonly THUMBNAIL_SIZE = 200;
  private readonly THUMBNAIL_QUALITY = 80;
  private processingQueue = new Map<string, Promise<ThumbnailResult>>();

  constructor() {
    // Create thumbnail cache directory in app data
    const userDataPath = app.getPath('userData');
    this.thumbnailCacheDir = path.join(userDataPath, 'thumbnails');
    this.ensureCacheDirectory();
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(this.thumbnailCacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create thumbnail cache directory:', error);
    }
  }

  private getThumbnailPath(imagePath: string): string {
    // Create a hash of the image path for consistent thumbnail naming
    const hash = crypto.createHash('md5').update(imagePath).digest('hex');
    return path.join(this.thumbnailCacheDir, `${hash}.jpg`);
  }

  private async isFileNewer(imagePath: string, thumbnailPath: string): Promise<boolean> {
    try {
      const [imageStats, thumbnailStats] = await Promise.all([
        fs.promises.stat(imagePath),
        fs.promises.stat(thumbnailPath)
      ]);
      return imageStats.mtime > thumbnailStats.mtime;
    } catch {
      return true; // If we can't stat, assume we need to regenerate
    }
  }

  public async getThumbnail(imagePath: string): Promise<ThumbnailResult> {
    try {
      // Check if we're already processing this image
      const existingProcess = this.processingQueue.get(imagePath);
      if (existingProcess) {
        return await existingProcess;
      }

      // Start processing and cache the promise
      const processingPromise = this.processThumbnail(imagePath);
      this.processingQueue.set(imagePath, processingPromise);

      try {
        const result = await processingPromise;
        return result;
      } finally {
        // Clean up the processing queue
        this.processingQueue.delete(imagePath);
      }
    } catch (error) {
      console.error('Error in getThumbnail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processThumbnail(imagePath: string): Promise<ThumbnailResult> {
    const thumbnailPath = this.getThumbnailPath(imagePath);

    try {
      // Check if thumbnail exists and is newer than the original image
      const thumbnailExists = await this.fileExists(thumbnailPath);
      if (thumbnailExists && !(await this.isFileNewer(imagePath, thumbnailPath))) {
        return {
          success: true,
          thumbnailPath: thumbnailPath
        };
      }

      // Check if source image exists
      if (!(await this.fileExists(imagePath))) {
        return {
          success: false,
          error: 'Source image not found'
        };
      }

      // Generate thumbnail using Sharp
      await sharp(imagePath)
        .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: this.THUMBNAIL_QUALITY,
          progressive: true
        })
        .toFile(thumbnailPath);

      return {
        success: true,
        thumbnailPath: thumbnailPath
      };

    } catch (error) {
      console.error(`Error generating thumbnail for ${imagePath}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Thumbnail generation failed'
      };
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  public async getThumbnails(imagePaths: string[]): Promise<Map<string, ThumbnailResult>> {
    const results = new Map<string, ThumbnailResult>();
    
    // Process thumbnails in batches to avoid overwhelming the system
    const BATCH_SIZE = 5;
    for (let i = 0; i < imagePaths.length; i += BATCH_SIZE) {
      const batch = imagePaths.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (imagePath) => {
        const result = await this.getThumbnail(imagePath);
        return { imagePath, result };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ imagePath, result }) => {
        results.set(imagePath, result);
      });
    }

    return results;
  }

  public async cleanupCache(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.thumbnailCacheDir);
      // Only keep thumbnails from the last 30 days
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(this.thumbnailCacheDir, file);
        try {
          const stats = await fs.promises.stat(filePath);
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.promises.unlink(filePath);
          }
        } catch (error) {
          // Ignore errors for individual files
          console.warn(`Failed to cleanup thumbnail ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during thumbnail cache cleanup:', error);
    }
  }
}
