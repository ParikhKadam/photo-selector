// Renderer process script for Photo Selector

class PhotoSelectorRenderer {
  constructor() {
    this.currentMediaFiles = []; // Store current media files for navigation
    this.currentImageIndex = -1; // Track current image index in preview
    this.starredPhotosCache = new Set(); // Cache for starred photos
    this.isViewingStarredPhotos = false; // Track if currently viewing starred photos
    this.isFilteringStarred = false; // Track if filtering to show only starred photos
    this.allMediaFiles = []; // Store all media files before filtering
    this.initializeEventListeners();
    this.createPreviewModal();
    this.loadStarredPhotosCache();
  }

  initializeEventListeners() {
    // Open folder button click handler
    const openFolderBtn = document.getElementById('open-folder-btn');
    if (openFolderBtn) {
      openFolderBtn.addEventListener('click', () => {
        this.openFolder();
      });
    }

    // Filter starred button click handler
    const filterStarredBtn = document.getElementById('filter-starred-btn');
    if (filterStarredBtn) {
      filterStarredBtn.addEventListener('click', () => {
        this.toggleStarredFilter();
      });
    }

    // Show all button click handler
    const showAllBtn = document.getElementById('show-all-btn');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        this.showAllPhotos();
      });
    }

    // Export starred button click handler
    const exportStarredBtn = document.getElementById('export-starred-btn');
    if (exportStarredBtn) {
      exportStarredBtn.addEventListener('click', () => {
        this.exportStarredPhotos();
      });
    }

    // Listen for folder selection from main process
    if (window.electronAPI) {
      window.electronAPI.onFolderSelected((folderPath) => {
        this.loadPhotosFromFolder(folderPath);
      });

      // Listen for show starred photos command
      window.electronAPI.onShowStarredPhotos(() => {
        this.showStarredPhotos();
      });
    }
  }

  async openFolder() {
    try {
      if (window.electronAPI) {
        const folderPath = await window.electronAPI.openFolder();
        if (folderPath) {
          this.loadPhotosFromFolder(folderPath);
        }
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  }

  async loadPhotosFromFolder(folderPath) {
    console.log('Loading photos from:', folderPath);
    
    // Reset starred photos view flag and filter
    this.isViewingStarredPhotos = false;
    this.isFilteringStarred = false;
    
    // Hide welcome section and show photo grid
    const welcomeSection = document.querySelector('.welcome-section');
    const photoGrid = document.getElementById('photo-grid');
    const toolbar = document.getElementById('toolbar');
    
    if (welcomeSection) {
      welcomeSection.style.display = 'none';
    }
    
    if (toolbar) {
      toolbar.style.display = 'flex';
    }
    
    if (photoGrid) {
      photoGrid.style.display = 'grid';
      photoGrid.innerHTML = '<div class="loading">Loading photos...</div>';
      
      try {
        // Get actual media files from the selected folder
        const mediaFiles = await window.electronAPI.getMediaFiles(folderPath);
        
        // Store all media files for filtering
        this.allMediaFiles = mediaFiles;
        this.currentMediaFiles = mediaFiles;
        
        // Clear loading message
        photoGrid.innerHTML = '';
        
        if (mediaFiles.length === 0) {
          photoGrid.innerHTML = '<div class="no-files">No images or videos found in this folder.</div>';
          return;
        }
        
        // Create photo items for each file
        mediaFiles.forEach((file, index) => {
          const photoItem = this.createPhotoItem(file, index);
          photoGrid.appendChild(photoItem);
        });

        // Load starred status for current files
        await this.updateStarredStatus(mediaFiles.map(f => f.path));
        
        // Update toolbar state
        this.updateToolbarState();
        this.updateExportButtonText();
        
      } catch (error) {
        console.error('Error loading media files:', error);
        photoGrid.innerHTML = '<div class="error">Error loading files from folder.</div>';
      }
    }
  }

  selectPhoto(file, index) {
    console.log('Selected file:', file.name);
    // Add visual feedback for selection
    const photoItems = document.querySelectorAll('.photo-item');
    photoItems.forEach(item => item.classList.remove('selected'));
    
    // Find and select the clicked item
    event.currentTarget.classList.add('selected');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  createPreviewModal() {
    // Create modal HTML structure
    const modal = document.createElement('div');
    modal.id = 'imagePreviewModal';
    modal.className = 'preview-modal';
    modal.innerHTML = `
      <div class="preview-backdrop" onclick="photoRenderer.closePreview()"></div>
      <div class="preview-container">
        <button class="preview-close" onclick="photoRenderer.closePreview()">&times;</button>
        <button class="nav-button nav-prev" onclick="photoRenderer.navigateImage(-1)" title="Previous image (←)">
          <span class="nav-icon">‹</span>
        </button>
        <button class="nav-button nav-next" onclick="photoRenderer.navigateImage(1)" title="Next image (→)">
          <span class="nav-icon">›</span>
        </button>
        <div class="preview-content">
          <img id="previewImage" class="preview-image" alt="Preview">
          <div class="preview-info">
            <h3 id="previewTitle">Image Title</h3>
            <div class="preview-details">
              <span id="previewSize">Size: Loading...</span>
              <span id="previewType">Type: Loading...</span>
              <span id="previewIndex">1 of 1</span>
            </div>
          </div>
        </div>
        <div class="preview-controls">
          <button onclick="photoRenderer.toggleCurrentImageStar()" class="preview-button star-preview-btn" id="previewStarButton" title="Add to starred photos">
            <span class="star-icon">★</span>
            <span class="star-text">Star</span>
          </button>
          <button onclick="photoRenderer.toggleFullscreen()" class="preview-button fullscreen-btn">
            <span class="fullscreen-icon">⛶</span>
            Fullscreen
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add keyboard and mouse event listeners
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('imagePreviewModal');
      if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') {
          this.closePreview();
        } else if (e.key === 'f' || e.key === 'F') {
          this.toggleFullscreen();
        } else if (e.key === 's' || e.key === 'S') {
          this.toggleCurrentImageStar();
        } else if (e.key === 'ArrowLeft') {
          this.navigateImage(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigateImage(1);
        }
      }
    });

    // Add mouse wheel navigation
    modal.addEventListener('wheel', (e) => {
      if (modal.style.display === 'flex') {
        e.preventDefault();
        if (e.deltaY > 0) {
          this.navigateImage(1); // Scroll down = next image
        } else {
          this.navigateImage(-1); // Scroll up = previous image
        }
      }
    });
  }

  async openPreview(file, index) {
    this.currentImageIndex = index;
    await this.displayImageAtIndex(index);
  }

  async displayImageAtIndex(index) {
    if (index < 0 || index >= this.currentMediaFiles.length) {
      return;
    }

    // Find the next image (skip videos)
    let imageIndex = index;
    const file = this.currentMediaFiles[imageIndex];
    
    if (file.type !== 'image') {
      // Find next image
      for (let i = index + 1; i < this.currentMediaFiles.length; i++) {
        if (this.currentMediaFiles[i].type === 'image') {
          imageIndex = i;
          break;
        }
      }
      // If no image found forward, search backward
      if (imageIndex === index) {
        for (let i = index - 1; i >= 0; i--) {
          if (this.currentMediaFiles[i].type === 'image') {
            imageIndex = i;
            break;
          }
        }
      }
    }

    this.currentImageIndex = imageIndex;
    const currentFile = this.currentMediaFiles[imageIndex];
    
    const modal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
    const previewTitle = document.getElementById('previewTitle');
    const previewSize = document.getElementById('previewSize');
    const previewType = document.getElementById('previewType');
    const previewIndex = document.getElementById('previewIndex');
    
    // Show modal
    modal.style.display = 'flex';
    
    // Update navigation button states
    this.updateNavigationButtons();
    
    // Update star button state
    this.updatePreviewStarButton();
    
    // Set file information
    previewTitle.textContent = currentFile.name;
    previewSize.textContent = `Size: ${this.formatFileSize(currentFile.size)}`;
    previewType.textContent = `Type: ${currentFile.type.toUpperCase()}`;
    
    // Update index display (only count images)
    const imageFiles = this.currentMediaFiles.filter(f => f.type === 'image');
    const currentImagePosition = imageFiles.findIndex(f => f.path === currentFile.path) + 1;
    previewIndex.textContent = `${currentImagePosition} of ${imageFiles.length}`;
    
    try {
      // Get image preview
      const result = await window.electronAPI.getImagePreview(currentFile.path);
      
      if (result.success && result.exists) {
        // Load the original quality image
        previewImage.src = `file://${result.filePath}`;
        previewImage.onload = () => {
          previewImage.style.opacity = '1';
        };
        previewImage.onerror = () => {
          previewImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIExvYWRpbmcgSW1hZ2U8L3RleHQ+PC9zdmc+';
        };
      } else {
        previewImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZpbGUgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPic=';
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      previewImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIExvYWRpbmcgSW1hZ2U8L3RleHQ+PC9zdmc+';
    }
  }

  closePreview() {
    const modal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    modal.style.display = 'none';
    modal.classList.remove('fullscreen-mode');
    previewImage.src = '';
    previewImage.style.opacity = '0';
    this.currentImageIndex = -1;
  }

  navigateImage(direction) {
    if (this.currentMediaFiles.length === 0) return;
    
    const imageFiles = this.currentMediaFiles.filter(f => f.type === 'image');
    if (imageFiles.length === 0) return;
    
    // Find current image position in image-only array
    const currentFile = this.currentMediaFiles[this.currentImageIndex];
    const currentImagePosition = imageFiles.findIndex(f => f.path === currentFile.path);
    
    // Calculate next position
    let nextImagePosition = currentImagePosition + direction;
    
    // Wrap around
    if (nextImagePosition >= imageFiles.length) {
      nextImagePosition = 0;
    } else if (nextImagePosition < 0) {
      nextImagePosition = imageFiles.length - 1;
    }
    
    // Find the index in the full media files array
    const nextImageFile = imageFiles[nextImagePosition];
    const nextIndex = this.currentMediaFiles.findIndex(f => f.path === nextImageFile.path);
    
    this.displayImageAtIndex(nextIndex);
  }

  updateNavigationButtons() {
    const imageFiles = this.currentMediaFiles.filter(f => f.type === 'image');
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');
    
    // Show/hide navigation buttons based on number of images
    if (imageFiles.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }

  toggleFullscreen() {
    const modal = document.getElementById('imagePreviewModal');
    const container = modal.querySelector('.preview-container');
    const fullscreenBtn = modal.querySelector('.fullscreen-btn');
    const fullscreenIcon = modal.querySelector('.fullscreen-icon');
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      container.requestFullscreen().then(() => {
        modal.classList.add('fullscreen-mode');
        fullscreenIcon.textContent = '⛷';
        fullscreenBtn.innerHTML = '<span class="fullscreen-icon">⛷</span>Exit Fullscreen';
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        modal.classList.remove('fullscreen-mode');
        fullscreenIcon.textContent = '⛶';
        fullscreenBtn.innerHTML = '<span class="fullscreen-icon">⛶</span>Fullscreen';
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  }

  createPhotoItem(file, index) {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    
    // Create different content based on file type
    let mediaElement;
    if (file.type === 'image') {
      mediaElement = `<img src="file://${file.path}" alt="${file.name}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='">`;
    } else {
      mediaElement = `
        <div class="video-thumbnail">
          <video src="file://${file.path}" preload="metadata" muted>
            <source src="file://${file.path}" type="video/mp4">
          </video>
          <div class="video-overlay">
            <span class="play-icon">▶</span>
          </div>
        </div>
      `;
    }
    
    // Format file size
    const fileSize = this.formatFileSize(file.size);
    
    photoItem.innerHTML = `
      ${mediaElement}
      <div class="photo-info">
        <div class="photo-name" title="${file.name}">${file.name}</div>
        <div class="photo-details">
          <span class="file-type">${file.type.toUpperCase()}</span>
          <span class="file-size">${fileSize}</span>
        </div>
      </div>
      <button class="star-button" title="Add to starred photos" data-file-path="${file.path}">
        <span class="star-icon">★</span>
      </button>
    `;
    
    // Add data attribute for easier star status updates
    photoItem.setAttribute('data-file-path', file.path);
    
    // Add click handler for photo selection
    photoItem.addEventListener('click', (e) => {
      // Don't select if clicking on star button
      if (!e.target.closest('.star-button')) {
        this.selectPhoto(file, index);
      }
    });
    
    // Add star button click handler
    const starButton = photoItem.querySelector('.star-button');
    if (starButton) {
      starButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePhotoStar(file, starButton);
      });
    }
    
    // Add double-click handler for preview (only for images)
    if (file.type === 'image') {
      photoItem.addEventListener('dblclick', () => {
        this.openPreview(file, index);
      });
      photoItem.style.cursor = 'pointer';
      photoItem.title = `Double-click to preview ${file.name}`;
    }
    
    return photoItem;
  }

  // Star/Shortlist functionality methods
  async loadStarredPhotosCache() {
    try {
      const result = await window.electronAPI.getStarredPhotos();
      if (result.success) {
        this.starredPhotosCache = new Set(result.photos.map(photo => photo.filePath));
        this.updateExportButtonText();
      }
    } catch (error) {
      console.error('Error loading starred photos cache:', error);
    }
  }

  async updateStarredStatus(filePaths) {
    if (!filePaths || filePaths.length === 0) return;

    try {
      const result = await window.electronAPI.getStarredPhotosByPaths(filePaths);
      if (result.success) {
        // Update cache
        this.starredPhotosCache = new Set([...this.starredPhotosCache, ...result.starredPaths]);
        
        // Update UI for starred photos
        result.starredPaths.forEach(filePath => {
          const photoItem = document.querySelector(`[data-file-path="${filePath}"]`);
          if (photoItem) {
            const starButton = photoItem.querySelector('.star-button');
            if (starButton) {
              starButton.classList.add('starred');
              starButton.title = 'Remove from starred photos';
            }
          }
        });
      }
    } catch (error) {
      console.error('Error updating starred status:', error);
    }
  }

  async togglePhotoStar(file, starButton) {
    const isCurrentlyStarred = this.starredPhotosCache.has(file.path);
    
    try {
      if (isCurrentlyStarred) {
        // Unstar the photo
        const result = await window.electronAPI.unstarPhoto(file.path);
        if (result.success) {
          this.starredPhotosCache.delete(file.path);
          starButton.classList.remove('starred');
          starButton.title = 'Add to starred photos';
          this.updateExportButtonText();
          
          // If we're viewing starred photos, remove the item from view
          if (this.isViewingStarredPhotos) {
            const photoItem = starButton.closest('.photo-item');
            if (photoItem) {
              photoItem.remove();
              
              // Check if there are no more starred photos
              const remainingItems = document.querySelectorAll('.photo-item').length;
              if (remainingItems === 0) {
                const photoGrid = document.getElementById('photo-grid');
                photoGrid.innerHTML = '<div class="no-files">No starred photos found.</div>';
              }
            }
          }
        }
      } else {
        // Star the photo
        const photoData = {
          filePath: file.path,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified.toISOString()
        };
        
        const result = await window.electronAPI.starPhoto(photoData);
        if (result.success) {
          this.starredPhotosCache.add(file.path);
          starButton.classList.add('starred');
          starButton.title = 'Remove from starred photos';
          this.updateExportButtonText();
        }
      }
    } catch (error) {
      console.error('Error toggling photo star:', error);
    }
  }

  async showStarredPhotos() {
    console.log('Showing starred photos');
    
    // Hide welcome section and show photo grid
    const welcomeSection = document.querySelector('.welcome-section');
    const photoGrid = document.getElementById('photo-grid');
    const toolbar = document.getElementById('toolbar');
    
    if (welcomeSection) {
      welcomeSection.style.display = 'none';
    }
    
    if (toolbar) {
      toolbar.style.display = 'flex';
    }
    
    if (photoGrid) {
      photoGrid.style.display = 'grid';
      photoGrid.innerHTML = '<div class="loading">Loading starred photos...</div>';
      
      try {
        const result = await window.electronAPI.getStarredPhotos();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load starred photos');
        }
        
        const starredPhotos = result.photos;
        
        // Convert to media files format
        this.currentMediaFiles = starredPhotos.map(photo => ({
          name: photo.fileName,
          path: photo.filePath,
          type: photo.fileType,
          size: photo.fileSize,
          lastModified: new Date(photo.lastModified)
        }));
        
        // Also set as allMediaFiles for consistency
        this.allMediaFiles = this.currentMediaFiles;
        this.isViewingStarredPhotos = true;
        this.isFilteringStarred = false;
        
        // Clear loading message
        photoGrid.innerHTML = '';
        
        if (starredPhotos.length === 0) {
          photoGrid.innerHTML = '<div class="no-files">No starred photos found.</div>';
          this.updateToolbarState();
          return;
        }
        
        // Create photo items for each starred photo
        starredPhotos.forEach((photo, index) => {
          const file = {
            name: photo.fileName,
            path: photo.filePath,
            type: photo.fileType,
            size: photo.fileSize,
            lastModified: new Date(photo.lastModified)
          };
          const photoItem = this.createPhotoItem(file, index);
          
          // Mark as starred
          const starButton = photoItem.querySelector('.star-button');
          if (starButton) {
            starButton.classList.add('starred');
            starButton.title = 'Remove from starred photos';
          }
          
          photoGrid.appendChild(photoItem);
        });
        
        // Update toolbar state
        this.updateToolbarState();
        
      } catch (error) {
        console.error('Error loading starred photos:', error);
        photoGrid.innerHTML = '<div class="error">Error loading starred photos.</div>';
      }
    }
  }

  async toggleCurrentImageStar() {
    if (this.currentImageIndex < 0 || this.currentImageIndex >= this.currentMediaFiles.length) {
      return;
    }

    const currentFile = this.currentMediaFiles[this.currentImageIndex];
    const previewStarButton = document.getElementById('previewStarButton');
    
    if (previewStarButton) {
      await this.togglePhotoStar(currentFile, previewStarButton);
      this.updatePreviewStarButton();
      
      // Also update the grid star button if visible
      const gridStarButton = document.querySelector(`[data-file-path="${currentFile.path}"] .star-button`);
      if (gridStarButton) {
        const isStarred = this.starredPhotosCache.has(currentFile.path);
        if (isStarred) {
          gridStarButton.classList.add('starred');
          gridStarButton.title = 'Remove from starred photos';
        } else {
          gridStarButton.classList.remove('starred');
          gridStarButton.title = 'Add to starred photos';
        }
      }
    }
  }

  updatePreviewStarButton() {
    if (this.currentImageIndex < 0 || this.currentImageIndex >= this.currentMediaFiles.length) {
      return;
    }

    const currentFile = this.currentMediaFiles[this.currentImageIndex];
    const previewStarButton = document.getElementById('previewStarButton');
    const isStarred = this.starredPhotosCache.has(currentFile.path);
    
    if (previewStarButton) {
      const starText = previewStarButton.querySelector('.star-text');
      
      if (isStarred) {
        previewStarButton.classList.add('starred');
        previewStarButton.title = 'Remove from starred photos (S)';
        if (starText) starText.textContent = 'Unstar';
      } else {
        previewStarButton.classList.remove('starred');
        previewStarButton.title = 'Add to starred photos (S)';
        if (starText) starText.textContent = 'Star';
      }
    }
  }

  // Filter and Export functionality
  toggleStarredFilter() {
    if (this.isViewingStarredPhotos) {
      // If already viewing starred photos, don't filter
      return;
    }

    this.isFilteringStarred = !this.isFilteringStarred;
    
    if (this.isFilteringStarred) {
      this.showOnlyStarredPhotos();
    } else {
      this.showAllPhotos();
    }
    
    this.updateToolbarState();
  }

  showOnlyStarredPhotos() {
    // Filter to show only starred photos from current folder
    const starredFiles = this.allMediaFiles.filter(file => 
      this.starredPhotosCache.has(file.path)
    );
    
    this.currentMediaFiles = starredFiles;
    this.renderPhotoGrid(starredFiles);
    this.isFilteringStarred = true;
  }

  showAllPhotos() {
    // Show all photos from current folder
    this.currentMediaFiles = this.allMediaFiles;
    this.renderPhotoGrid(this.allMediaFiles);
    this.isFilteringStarred = false;
    this.updateToolbarState();
  }

  renderPhotoGrid(mediaFiles) {
    const photoGrid = document.getElementById('photo-grid');
    
    if (!photoGrid) return;
    
    photoGrid.innerHTML = '';
    
    if (mediaFiles.length === 0) {
      if (this.isFilteringStarred) {
        photoGrid.innerHTML = '<div class="no-files">No starred photos found in this folder.</div>';
      } else {
        photoGrid.innerHTML = '<div class="no-files">No images or videos found in this folder.</div>';
      }
      return;
    }
    
    // Create photo items for each file
    mediaFiles.forEach((file, index) => {
      const photoItem = this.createPhotoItem(file, index);
      photoGrid.appendChild(photoItem);
    });

    // Update starred status display
    this.updateStarredStatusDisplay();
  }

  updateStarredStatusDisplay() {
    // Update the star button states for visible photos
    this.currentMediaFiles.forEach(file => {
      const photoItem = document.querySelector(`[data-file-path="${file.path}"]`);
      if (photoItem) {
        const starButton = photoItem.querySelector('.star-button');
        if (starButton) {
          const isStarred = this.starredPhotosCache.has(file.path);
          if (isStarred) {
            starButton.classList.add('starred');
            starButton.title = 'Remove from starred photos';
          } else {
            starButton.classList.remove('starred');
            starButton.title = 'Add to starred photos';
          }
        }
      }
    });
  }

  updateToolbarState() {
    const filterBtn = document.getElementById('filter-starred-btn');
    const showAllBtn = document.getElementById('show-all-btn');
    
    if (filterBtn && showAllBtn) {
      if (this.isViewingStarredPhotos) {
        // When viewing starred photos collection, disable filter button
        filterBtn.classList.remove('active');
        filterBtn.style.opacity = '0.5';
        filterBtn.style.pointerEvents = 'none';
        filterBtn.title = 'Filter not available in starred photos view';
        showAllBtn.style.display = 'none';
      } else if (this.isFilteringStarred) {
        // When filtering starred photos in folder view
        filterBtn.classList.add('active');
        filterBtn.style.opacity = '1';
        filterBtn.style.pointerEvents = 'auto';
        filterBtn.title = 'Show only starred photos';
        showAllBtn.style.display = 'flex';
      } else {
        // Normal folder view
        filterBtn.classList.remove('active');
        filterBtn.style.opacity = '1';
        filterBtn.style.pointerEvents = 'auto';
        filterBtn.title = 'Show only starred photos';
        showAllBtn.style.display = 'none';
      }
    }
  }

  async exportStarredPhotos() {
    try {
      // Get starred photos
      const result = await window.electronAPI.getStarredPhotos();
      
      if (!result.success || result.photos.length === 0) {
        alert('No starred photos to export.');
        return;
      }
      
      // Select export destination
      const exportPath = await window.electronAPI.selectExportFolder();
      
      if (!exportPath) {
        return; // User cancelled
      }
      
      // Show progress (we'll create a simple progress indicator)
      this.showExportProgress(true);
      
      // Export the photos
      const exportResult = await window.electronAPI.exportStarredPhotos(exportPath);
      
      this.showExportProgress(false);
      
      if (exportResult.success && exportResult.results) {
        const { exported, failed, errors } = exportResult.results;
        
        let message = `Export completed!\n\n`;
        message += `✅ Successfully exported: ${exported} photos\n`;
        
        if (failed > 0) {
          message += `❌ Failed to export: ${failed} photos\n\n`;
          message += `Errors:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            message += `\n... and ${errors.length - 5} more errors`;
          }
        }
        
        alert(message);
      } else {
        alert(`Export failed: ${exportResult.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      this.showExportProgress(false);
      console.error('Error exporting starred photos:', error);
      alert('Failed to export starred photos. Please try again.');
    }
  }

  showExportProgress(show) {
    const exportBtn = document.getElementById('export-starred-btn');
    
    if (!exportBtn) return;
    
    if (show) {
      exportBtn.disabled = true;
      exportBtn.innerHTML = '<span class="icon">⏳</span><span class="text">Exporting...</span>';
    } else {
      exportBtn.disabled = false;
      exportBtn.innerHTML = '<span class="icon">📤</span><span class="text">Export Starred</span>';
    }
  }

  updateExportButtonText() {
    const exportBtn = document.getElementById('export-starred-btn');
    if (exportBtn && !exportBtn.disabled) {
      const count = this.starredPhotosCache.size;
      const text = count > 0 ? `Export Starred (${count})` : 'Export Starred';
      exportBtn.innerHTML = `<span class="icon">📤</span><span class="text">${text}</span>`;
    }
  }

  selectPhoto(photo) {
    console.log('Selected photo:', photo.name);
    // Add visual feedback for selection
    const photoItems = document.querySelectorAll('.photo-item');
    photoItems.forEach(item => item.classList.remove('selected'));
    
    // Find and select the clicked item
    event.currentTarget.classList.add('selected');
  }
}

// Initialize the renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.photoRenderer = new PhotoSelectorRenderer();
});

// Add CSS for selected state
const style = document.createElement('style');
style.textContent = `
  .photo-item.selected {
    border: 3px solid #667eea;
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;
document.head.appendChild(style);
