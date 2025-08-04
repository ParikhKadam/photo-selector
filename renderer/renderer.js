// Renderer process script for Photo Selector

class PhotoSelectorRenderer {
  constructor() {
    this.currentMediaFiles = []; // Store current media files for navigation
    this.currentImageIndex = -1; // Track current image index in preview
    this.starredPhotosCache = new Set(); // Cache for starred photos
    this.isViewingStarredPhotos = false; // Track if currently viewing starred photos
    this.isFilteringStarred = false; // Track if filtering to show only starred photos
    this.allMediaFiles = []; // Store all media files before filtering
    
    // Zoom and pan state
    this.zoomLevel = 1;
    this.minZoom = 0.1;
    this.maxZoom = 5;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Light throttling for wheel events
    this.lastWheelTime = 0;
    
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

    // Back to home button click handler
    const backHomeBtn = document.getElementById('back-home-btn');
    if (backHomeBtn) {
      backHomeBtn.addEventListener('click', () => {
        this.goBackToHome();
      });
    }

    // Filter starred button click handler
    const filterStarredBtn = document.getElementById('filter-starred-btn');
    if (filterStarredBtn) {
      filterStarredBtn.addEventListener('click', () => {
        this.toggleStarredFilter();
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

      // Listen for go back home command
      window.electronAPI.onGoBackHome(() => {
        this.goBackToHome();
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
        <!-- Close button -->
        <button class="preview-close" onclick="photoRenderer.closePreview()" title="Close (ESC)">&times;</button>
        
        <!-- Navigation buttons -->
        <button class="nav-button nav-prev" onclick="photoRenderer.navigateImage(-1)" title="Previous image (←)">
          <span class="nav-icon">‹</span>
        </button>
        <button class="nav-button nav-next" onclick="photoRenderer.navigateImage(1)" title="Next image (→)">
          <span class="nav-icon">›</span>
        </button>

        <!-- Main content -->
        <div class="preview-content">
          <div class="zoom-container" id="zoomContainer">
            <img id="previewImage" class="preview-image" alt="Preview" style="display: none;">
            <video id="previewVideo" class="preview-video" controls preload="metadata" style="display: none;">
              <source id="videoSource" src="" type="">
              Your browser does not support the video element.
            </video>
          </div>
        </div>

        <!-- Bottom info bar (preview mode only) -->
        <div class="preview-info-bar">
          <div class="preview-file-info">
            <h3 id="previewTitle" class="preview-filename">Image Title</h3>
            <div class="preview-meta">
              <span id="previewIndex">1 of 1</span>
              <span id="zoomLevel">100%</span>
            </div>
          </div>
          <div class="preview-actions">
            <button onclick="photoRenderer.toggleCurrentImageStar()" class="action-btn star-btn" id="previewStarButton" title="Star photo (S)">
              <span class="star-icon">★</span>
            </button>
            <div class="zoom-controls">
              <button onclick="photoRenderer.zoomOut()" class="action-btn zoom-btn" id="zoomOutBtn" title="Zoom out (-)">−</button>
              <button onclick="photoRenderer.zoomIn()" class="action-btn zoom-btn" id="zoomInBtn" title="Zoom in (+)">+</button>
              <button onclick="photoRenderer.resetZoom()" class="action-btn zoom-btn" id="zoomResetBtn" title="Reset zoom (0)">⌂</button>
            </div>
            <button onclick="photoRenderer.toggleFullscreen()" class="action-btn fullscreen-btn" title="Enter fullscreen (F)">
              <span class="fullscreen-icon">⛶</span>
            </button>
          </div>
        </div>

        <!-- Fullscreen overlay controls (only visible in fullscreen) -->
        <div class="fullscreen-overlay-controls">
          <div class="fullscreen-top-bar">
            <div class="fullscreen-info">
              <span id="fullscreenTitle" class="fullscreen-filename">Image Title</span>
              <span id="fullscreenIndex" class="fullscreen-counter">1 of 1</span>
            </div>
            <button class="fullscreen-close" onclick="photoRenderer.closePreview()" title="Close (ESC)">&times;</button>
          </div>
          
          <div class="fullscreen-bottom-bar">
            <div class="fullscreen-actions">
              <button onclick="photoRenderer.toggleCurrentImageStar()" class="fullscreen-btn star-btn-fs" id="previewStarButtonFS" title="Star photo (S)">
                <span class="star-icon">★</span>
              </button>
              <div class="fullscreen-zoom-controls">
                <button onclick="photoRenderer.zoomOut()" class="fullscreen-btn zoom-btn-fs" title="Zoom out (-)">−</button>
                <span id="zoomLevelFS" class="zoom-display-fs">100%</span>
                <button onclick="photoRenderer.zoomIn()" class="fullscreen-btn zoom-btn-fs" title="Zoom in (+)">+</button>
                <button onclick="photoRenderer.resetZoom()" class="fullscreen-btn zoom-btn-fs" title="Reset zoom (0)">⌂</button>
              </div>
              <button onclick="photoRenderer.toggleFullscreen()" class="fullscreen-btn exit-fullscreen-btn" title="Exit fullscreen (F)">
                <span class="fullscreen-icon">⛷</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Hidden elements for compatibility -->
        <div style="display: none;">
          <span id="previewSize">Size: Loading...</span>
          <span id="previewType">Type: Loading...</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize fullscreen controls
    this.initializeFullscreenControls(modal);
    
    // Add keyboard and mouse event listeners
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('imagePreviewModal');
      if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') {
          this.handleEscapeKey();
        } else if (e.key === 'f' || e.key === 'F') {
          this.toggleFullscreen();
        } else if (e.key === 's' || e.key === 'S') {
          this.toggleCurrentImageStar();
        } else if (e.ctrlKey && e.key === 'ArrowLeft') {
          // Ctrl+Left: Skip backward 10 seconds (check BEFORE regular ArrowLeft)
          e.preventDefault();
          this.skipVideoBackward();
        } else if (e.ctrlKey && e.key === 'ArrowRight') {
          // Ctrl+Right: Skip forward 10 seconds (check BEFORE regular ArrowRight)
          e.preventDefault();
          this.skipVideoForward();
        } else if (e.key === 'ArrowLeft') {
          this.navigateImage(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigateImage(1);
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          this.zoomIn();
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          this.zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          this.resetZoom();
        } else if (e.key === ' ') {
          // Spacebar: Toggle play/pause for videos
          e.preventDefault();
          this.toggleVideoPlayPause();
        }
      } else {
        // Global keyboard shortcuts (when not in preview)
        if (e.key === 'Escape') {
          this.goBackToHome();
        } else if (e.ctrlKey && e.key === 'h') {
          e.preventDefault();
          this.goBackToHome();
        }
      }
    });

    // Handle fullscreen changes (including F11 and Electron menu toggles)
    document.addEventListener('fullscreenchange', () => {
      const modal = document.getElementById('imagePreviewModal');
      if (modal && modal.style.display === 'flex') {
        const fullscreenBtn = modal.querySelector('.fullscreen-btn');
        const fullscreenIcon = modal.querySelector('.fullscreen-icon');
        
        if (document.fullscreenElement) {
          // Entered fullscreen
          modal.classList.add('fullscreen-mode');
          fullscreenIcon.textContent = '⛷';
          fullscreenBtn.innerHTML = '<span class="fullscreen-icon">⛷</span>Exit Fullscreen';
        } else {
          // Exited fullscreen
          modal.classList.remove('fullscreen-mode');
          fullscreenIcon.textContent = '⛶';
          fullscreenBtn.innerHTML = '<span class="fullscreen-icon">⛶</span>Fullscreen';
        }
      }
    });

    // Add mouse wheel zoom (images only) - optimized for touchpad responsiveness
    modal.addEventListener('wheel', (e) => {
      if (modal.style.display === 'flex') {
        e.preventDefault();
        e.stopPropagation();
        
        const previewImage = document.getElementById('previewImage');
        const isImageVisible = previewImage && previewImage.style.display !== 'none';
        
        // Only allow zoom for images
        if (isImageVisible) {
          const now = Date.now();
          const timeDelta = now - this.lastWheelTime;
          
          // Light throttling only for excessive events (120fps max)
          if (timeDelta < 8) {
            return;
          }
          
          this.lastWheelTime = now;
          
          // Detect touchpad vs mouse wheel
          const isTouchpad = Math.abs(e.deltaY) < 50;
          
          if (isTouchpad) {
            // For touchpad: immediate, smooth, smaller increments
            if (e.deltaY < -2) {
              this.smoothZoomIn();
            } else if (e.deltaY > 2) {
              this.smoothZoomOut();
            }
          } else {
            // For mouse wheel: larger increments, less sensitive
            if (e.deltaY < 0) {
              this.zoomIn();
            } else {
              this.zoomOut();
            }
          }
        }
      }
    });

    // Add mouse drag support for panning when zoomed on images
    const zoomContainer = modal.querySelector('#zoomContainer');
    if (zoomContainer) {
      zoomContainer.addEventListener('mousedown', (e) => {
        const previewImage = document.getElementById('previewImage');
        const isImageVisible = previewImage && previewImage.style.display !== 'none';
        
        if (this.zoomLevel > 1 && isImageVisible) {
          this.isDragging = true;
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
          zoomContainer.style.cursor = 'grabbing';
          e.preventDefault();
        }
      });

      document.addEventListener('mousemove', (e) => {
        if (this.isDragging && this.zoomLevel > 1) {
          const deltaX = e.clientX - this.lastMouseX;
          const deltaY = e.clientY - this.lastMouseY;
          
          this.panX += deltaX;
          this.panY += deltaY;
          
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
          
          this.updateImageTransform();
          e.preventDefault();
        }
      });

      document.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          if (zoomContainer) {
            const previewImage = document.getElementById('previewImage');
            const isImageVisible = previewImage && previewImage.style.display !== 'none';
            zoomContainer.style.cursor = (this.zoomLevel > 1 && isImageVisible) ? 'grab' : 'default';
          }
        }
      });
    }
  }

  async openPreview(file, index) {
    this.currentImageIndex = index;
    await this.displayImageAtIndex(index);
  }

  async displayImageAtIndex(index) {
    if (index < 0 || index >= this.currentMediaFiles.length) {
      return;
    }

    // Display the media file at the given index (image or video)
    this.currentImageIndex = index;
    const currentFile = this.currentMediaFiles[index];
    
    const modal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');
    const videoSource = document.getElementById('videoSource');
    const previewTitle = document.getElementById('previewTitle');
    const previewSize = document.getElementById('previewSize');
    const previewType = document.getElementById('previewType');
    const previewIndex = document.getElementById('previewIndex');
    
    // Show modal
    modal.style.display = 'flex';
    
    // Reset zoom state when opening new media
    this.resetZoom();
    
    // Update navigation button states
    this.updateNavigationButtons();
    
    // Update star button state
    this.updatePreviewStarButton();
    
    // Set file information
    previewTitle.textContent = currentFile.name;
    previewSize.textContent = `Size: ${this.formatFileSize(currentFile.size)}`;
    previewType.textContent = `Type: ${currentFile.type.toUpperCase()}`;
    
    // Also update fullscreen title
    const fullscreenTitle = document.getElementById('fullscreenTitle');
    if (fullscreenTitle) {
      fullscreenTitle.textContent = currentFile.name;
    }
    
    // Update index display (count all media files)
    const currentMediaPosition = this.currentMediaFiles.findIndex(f => f.path === currentFile.path) + 1;
    previewIndex.textContent = `${currentMediaPosition} of ${this.currentMediaFiles.length}`;
    
    // Also update fullscreen index
    const fullscreenIndex = document.getElementById('fullscreenIndex');
    if (fullscreenIndex) {
      fullscreenIndex.textContent = `${currentMediaPosition} of ${this.currentMediaFiles.length}`;
    }
    
    // Hide both elements initially
    previewImage.style.display = 'none';
    previewVideo.style.display = 'none';
    
    try {
      // Get media preview
      const result = await window.electronAPI.getImagePreview(currentFile.path);
      
      if (result.success && result.exists) {
        if (currentFile.type === 'video') {
          // Handle video files
          previewVideo.src = `file://${result.filePath}`;
          
          // Remove any poster to prevent gray overlay
          previewVideo.removeAttribute('poster');
          
          // Add event listeners to handle video loading states
          previewVideo.onloadstart = () => {
            previewVideo.style.opacity = '0.7';
          };
          
          previewVideo.oncanplay = () => {
            previewVideo.style.opacity = '1';
          };
          
          previewVideo.onloadeddata = () => {
            previewVideo.style.opacity = '1';
          };
          
          previewVideo.onerror = () => {
            previewVideo.style.opacity = '0.5';
            console.error('Error loading video:', currentFile.path);
          };
          
          previewVideo.load(); // Reload the video element
          previewVideo.style.display = 'block';
          previewVideo.style.opacity = '1';
          
          // Disable zoom controls for videos
          this.setZoomControlsVisibility(false);
        } else {
          // Handle image files
          previewImage.src = `file://${result.filePath}`;
          previewImage.style.display = 'block';
          previewImage.onload = () => {
            previewImage.style.opacity = '1';
          };
          previewImage.onerror = () => {
            previewImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIExvYWRpbmcgSW1hZ2U8L3RleHQ+PC9zdmc+';
          };
          
          // Enable zoom controls for images
          this.setZoomControlsVisibility(true);
        }
      } else {
        // Show error state
        previewImage.style.display = 'block';
        previewImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZpbGUgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPic=';
        this.setZoomControlsVisibility(false);
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      previewImage.style.display = 'block';
      previewImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIExvYWRpbmcgSW1hZ2U8L3RleHQ+PC9zdmc+';
      this.setZoomControlsVisibility(false);
    }
  }

  handleEscapeKey() {
    // Smart ESC handling: exit fullscreen first, then close preview
    if (document.fullscreenElement) {
      // If in fullscreen, exit fullscreen but stay in preview
      document.exitFullscreen().then(() => {
        const modal = document.getElementById('imagePreviewModal');
        modal.classList.remove('fullscreen-mode');
        
        // Update fullscreen button UI
        const fullscreenBtn = modal.querySelector('.fullscreen-btn');
        const fullscreenIcon = modal.querySelector('.fullscreen-icon');
        fullscreenIcon.textContent = '⛶';
        fullscreenBtn.innerHTML = '<span class="fullscreen-icon">⛶</span>Fullscreen';
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    } else {
      // If not in fullscreen, close the preview completely
      this.closePreview();
    }
  }

  closePreview() {
    const modal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');
    
    // Clear fullscreen control timer
    if (this.fullscreenHideTimeout) {
      clearTimeout(this.fullscreenHideTimeout);
      this.fullscreenHideTimeout = null;
    }
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    modal.style.display = 'none';
    modal.classList.remove('fullscreen-mode');
    
    // Reset image
    previewImage.src = '';
    previewImage.style.opacity = '0';
    previewImage.style.display = 'none';
    
    // Reset video
    if (previewVideo) {
      previewVideo.pause();
      previewVideo.currentTime = 0;
      previewVideo.style.display = 'none';
      const videoSource = document.getElementById('videoSource');
      if (videoSource) {
        videoSource.src = '';
      }
    }
    
    this.currentImageIndex = -1;
  }

  navigateImage(direction) {
    if (this.currentMediaFiles.length === 0) return;
    
    // Navigate through all media files (images and videos)
    let nextIndex = this.currentImageIndex + direction;
    
    // Wrap around
    if (nextIndex >= this.currentMediaFiles.length) {
      nextIndex = 0;
    } else if (nextIndex < 0) {
      nextIndex = this.currentMediaFiles.length - 1;
    }
    
    this.displayImageAtIndex(nextIndex);
  }

  updateNavigationButtons() {
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');
    
    // Show/hide navigation buttons based on number of media files
    if (this.currentMediaFiles.length <= 1) {
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
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      container.requestFullscreen().then(() => {
        modal.classList.add('fullscreen-mode');
        this.updateFullscreenButton(true);
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        modal.classList.remove('fullscreen-mode');
        this.updateFullscreenButton(false);
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  }

  toggleVideoPlayPause() {
    const previewVideo = document.getElementById('previewVideo');
    const isVideoVisible = previewVideo && previewVideo.style.display !== 'none';
    
    if (isVideoVisible) {
      if (previewVideo.paused) {
        previewVideo.play().catch(err => {
          console.error('Error playing video:', err);
        });
      } else {
        previewVideo.pause();
      }
    }
  }

  skipVideoBackward() {
    const previewVideo = document.getElementById('previewVideo');
    const isVideoVisible = previewVideo && previewVideo.style.display !== 'none';
    
    if (isVideoVisible) {
      previewVideo.currentTime = Math.max(0, previewVideo.currentTime - 10);
    }
  }

  skipVideoForward() {
    const previewVideo = document.getElementById('previewVideo');
    const isVideoVisible = previewVideo && previewVideo.style.display !== 'none';
    
    if (isVideoVisible) {
      previewVideo.currentTime = Math.min(previewVideo.duration || 0, previewVideo.currentTime + 10);
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
    
    // Add double-click handler for preview (for both images and videos)
    photoItem.addEventListener('dblclick', () => {
      this.openPreview(file, index);
    });
    photoItem.style.cursor = 'pointer';
    photoItem.title = `Double-click to preview ${file.name}`;
    
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
    const isStarred = this.starredPhotosCache.has(currentFile.path);
    
    this.updateStarButton(isStarred);
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
    
    if (filterBtn) {
      if (this.isViewingStarredPhotos) {
        // When viewing starred photos collection, disable filter button
        filterBtn.classList.remove('active');
        filterBtn.style.opacity = '0.5';
        filterBtn.style.pointerEvents = 'none';
        filterBtn.title = 'Filter not available in starred photos view';
      } else if (this.isFilteringStarred) {
        // When filtering starred photos in folder view
        filterBtn.classList.add('active');
        filterBtn.style.opacity = '1';
        filterBtn.style.pointerEvents = 'auto';
        filterBtn.title = 'Show only starred photos';
      } else {
        // Normal folder view
        filterBtn.classList.remove('active');
        filterBtn.style.opacity = '1';
        filterBtn.style.pointerEvents = 'auto';
        filterBtn.title = 'Show only starred photos';
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

  goBackToHome() {
    // Reset all state
    this.currentMediaFiles = [];
    this.allMediaFiles = [];
    this.currentImageIndex = -1;
    this.isViewingStarredPhotos = false;
    this.isFilteringStarred = false;

    // Hide toolbar and photo grid
    const toolbar = document.getElementById('toolbar');
    const photoGrid = document.getElementById('photo-grid');
    const welcomeSection = document.querySelector('.welcome-section');

    if (toolbar) {
      toolbar.style.display = 'none';
    }
    
    if (photoGrid) {
      photoGrid.style.display = 'none';
      photoGrid.innerHTML = '';
    }
    
    if (welcomeSection) {
      welcomeSection.style.display = 'flex';
    }

    console.log('Returned to home screen');
  }

  selectPhoto(photo) {
    console.log('Selected photo:', photo.name);
    // Add visual feedback for selection
    const photoItems = document.querySelectorAll('.photo-item');
    photoItems.forEach(item => item.classList.remove('selected'));
    
    // Find and select the clicked item
    event.currentTarget.classList.add('selected');
  }

  smoothZoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel += 0.1; // Very small increments for touchpad
      this.updateImageTransform();
      this.updateZoomControls();
    }
  }

  smoothZoomOut() {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel -= 0.1; // Very small increments for touchpad
      this.updateImageTransform();
      this.updateZoomControls();
    }
  }

  zoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel += 0.25; // Smaller increments for smoother zooming
      this.updateImageTransform();
      this.updateZoomControls();
    }
  }

  zoomOut() {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel -= 0.25; // Smaller increments for smoother zooming
      this.updateImageTransform();
      this.updateZoomControls();
    }
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.updateImageTransform();
    this.updateZoomControls();
  }

  updateImageTransform() {
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');
    const zoomContainer = document.getElementById('zoomContainer');
    
    // Only apply zoom to images, not videos
    if (previewImage && previewImage.style.display !== 'none') {
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        previewImage.style.transform = `scale(${this.zoomLevel}) translate(${this.panX / this.zoomLevel}px, ${this.panY / this.zoomLevel}px)`;
        previewImage.style.transformOrigin = 'center center';
      });
    }
    
    if (zoomContainer) {
      // Only enable grab cursor for images when zoomed
      const isImage = previewImage && previewImage.style.display !== 'none';
      zoomContainer.style.cursor = (isImage && this.zoomLevel > 1) ? 'grab' : 'default';
    }
  }

  updateZoomControls() {
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const zoomLevelDisplay = document.getElementById('zoomLevel');
    
    if (zoomInBtn) {
      zoomInBtn.disabled = this.zoomLevel >= this.maxZoom;
    }
    if (zoomOutBtn) {
      zoomOutBtn.disabled = this.zoomLevel <= this.minZoom;
    }
    if (zoomResetBtn) {
      zoomResetBtn.disabled = this.zoomLevel === 1 && this.panX === 0 && this.panY === 0;
    }
    if (zoomLevelDisplay) {
      zoomLevelDisplay.textContent = `Zoom: ${Math.round(this.zoomLevel * 100)}%`;
    }
  }

  getVideoMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'mkv': 'video/x-matroska',
      'm4v': 'video/mp4',
      '3gp': 'video/3gpp'
    };
    return mimeTypes[ext] || 'video/mp4';
  }

  setZoomControlsVisibility(visible) {
    const zoomControls = document.querySelector('.zoom-controls');
    const zoomLevelDisplay = document.getElementById('zoomLevel');
    
    if (zoomControls) {
      zoomControls.style.display = visible ? 'flex' : 'none';
    }
    if (zoomLevelDisplay) {
      zoomLevelDisplay.style.display = visible ? 'inline' : 'none';
    }
  }

  // Fullscreen controls functionality
  initializeFullscreenControls(modal) {
    this.fullscreenControlsVisible = false;
    this.fullscreenHideTimeout = null;
    this.lastMouseMove = Date.now();
    
    // Get fullscreen overlay controls
    this.fullscreenOverlay = modal.querySelector('.fullscreen-overlay-controls');
    
    // Mouse movement handler for fullscreen only
    const handleMouseMove = (e) => {
      if (document.fullscreenElement) {
        this.lastMouseMove = Date.now();
        this.showFullscreenControls();
        this.resetFullscreenHideTimer();
      }
    };

    // Mouse leave handler for fullscreen
    const handleMouseLeave = () => {
      if (document.fullscreenElement) {
        this.resetFullscreenHideTimer(1000); // Hide faster when mouse leaves
      }
    };

    // Attach event listeners
    modal.addEventListener('mousemove', handleMouseMove);
    modal.addEventListener('mouseleave', handleMouseLeave);
    
    // Add fullscreen change listener
    document.addEventListener('fullscreenchange', () => {
      const modalElement = document.getElementById('imagePreviewModal');
      if (modalElement && modalElement.style.display === 'flex') {
        const isFullscreen = !!document.fullscreenElement;
        if (isFullscreen) {
          modalElement.classList.add('fullscreen-mode');
          this.hideFullscreenControls(); // Start hidden in fullscreen
          this.syncFullscreenData(); // Sync data to fullscreen elements
        } else {
          modalElement.classList.remove('fullscreen-mode');
          this.showFullscreenControls(); // Reset controls when exiting fullscreen
        }
        this.updateFullscreenButton(isFullscreen);
      }
    });
  }

  showFullscreenControls() {
    if (!this.fullscreenControlsVisible && document.fullscreenElement) {
      this.fullscreenControlsVisible = true;
      if (this.fullscreenOverlay) {
        this.fullscreenOverlay.classList.add('fullscreen-controls-visible');
        this.fullscreenOverlay.classList.remove('fullscreen-controls-hidden');
      }
    }
  }

  hideFullscreenControls() {
    if (this.fullscreenControlsVisible) {
      this.fullscreenControlsVisible = false;
      if (this.fullscreenOverlay) {
        this.fullscreenOverlay.classList.add('fullscreen-controls-hidden');
        this.fullscreenOverlay.classList.remove('fullscreen-controls-visible');
      }
    }
  }

  resetFullscreenHideTimer(delay = 3000) {
    if (!document.fullscreenElement) return;
    
    // Clear existing timeout
    if (this.fullscreenHideTimeout) {
      clearTimeout(this.fullscreenHideTimeout);
    }
    
    // Set new timeout
    this.fullscreenHideTimeout = setTimeout(() => {
      // Check if mouse has been idle and we're still in fullscreen
      const timeSinceLastMove = Date.now() - this.lastMouseMove;
      if (timeSinceLastMove >= delay - 100 && document.fullscreenElement) {
        this.hideFullscreenControls();
      }
    }, delay);
  }

  // Sync data between preview and fullscreen elements
  syncFullscreenData() {
    // Sync filename
    const previewTitle = document.getElementById('previewTitle');
    const fullscreenTitle = document.getElementById('fullscreenTitle');
    if (previewTitle && fullscreenTitle) {
      fullscreenTitle.textContent = previewTitle.textContent;
    }

    // Sync index
    const previewIndex = document.getElementById('previewIndex');
    const fullscreenIndex = document.getElementById('fullscreenIndex');
    if (previewIndex && fullscreenIndex) {
      fullscreenIndex.textContent = previewIndex.textContent;
    }

    // Sync zoom level
    const zoomLevel = document.getElementById('zoomLevel');
    const zoomLevelFS = document.getElementById('zoomLevelFS');
    if (zoomLevel && zoomLevelFS) {
      zoomLevelFS.textContent = zoomLevel.textContent;
    }

    // Sync star status
    const starBtn = document.getElementById('previewStarButton');
    const starBtnFS = document.getElementById('previewStarButtonFS');
    if (starBtn && starBtnFS) {
      starBtnFS.className = starBtn.className.replace('star-btn', 'star-btn-fs');
    }
  }

  // Update existing methods to work with new structure
  updateStarButton(isStarred) {
    // Update preview star button
    const starButton = document.getElementById('previewStarButton');
    const starIcon = starButton?.querySelector('.star-icon');
    
    if (starButton && starIcon) {
      if (isStarred) {
        starButton.classList.add('starred');
        starButton.title = 'Remove from starred photos (S)';
        starIcon.style.color = '#f39c12';
      } else {
        starButton.classList.remove('starred');
        starButton.title = 'Star photo (S)';
        starIcon.style.color = '';
      }
    }

    // Update fullscreen star button
    const starButtonFS = document.getElementById('previewStarButtonFS');
    const starIconFS = starButtonFS?.querySelector('.star-icon');
    
    if (starButtonFS && starIconFS) {
      if (isStarred) {
        starButtonFS.classList.add('starred');
        starButtonFS.title = 'Remove from starred photos (S)';
        starIconFS.style.color = '#f39c12';
      } else {
        starButtonFS.classList.remove('starred');
        starButtonFS.title = 'Star photo (S)';
        starIconFS.style.color = '';
      }
    }
  }

  updateFullscreenButton(isFullscreen) {
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    const fullscreenIcon = document.querySelector('.fullscreen-icon');
    
    if (fullscreenBtn && fullscreenIcon) {
      if (isFullscreen) {
        fullscreenIcon.textContent = '⛷';
        fullscreenBtn.title = 'Exit fullscreen (F)';
      } else {
        fullscreenIcon.textContent = '⛶';
        fullscreenBtn.title = 'Enter fullscreen (F)';
      }
    }
  }

  // Override zoom level updates to sync both displays
  updateZoomDisplay() {
    const zoomLevel = document.getElementById('zoomLevel');
    const zoomLevelFS = document.getElementById('zoomLevelFS');
    const zoomPercentage = Math.round(this.currentZoom * 100) + '%';
    
    if (zoomLevel) zoomLevel.textContent = zoomPercentage;
    if (zoomLevelFS) zoomLevelFS.textContent = zoomPercentage;
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
