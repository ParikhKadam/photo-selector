// Renderer process script for Photo Selector

class PhotoSelectorRenderer {
  constructor() {
    this.currentMediaFiles = []; // Store current media files for navigation
    this.currentImageIndex = -1; // Track current image index in preview
    this.starredPhotosCache = new Set(); // Cache for starred photos
    this.isViewingStarredPhotos = false; // Track if currently viewing starred photos
    this.isFilteringStarred = false; // Track if filtering to show only starred photos
    this.allMediaFiles = []; // Store all media files before filtering
    this.currentFolderPath = null; // Track current folder path for navigation
    this.folderHistory = []; // Track folder navigation history

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

    // Back folder button click handler
    const backFolderBtn = document.getElementById('back-folder-btn');
    if (backFolderBtn) {
      backFolderBtn.addEventListener('click', () => {
        this.goBackFolder();
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

    // Set current folder path
    this.currentFolderPath = folderPath;

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
      photoGrid.innerHTML = '<div class="loading">Loading folder contents...</div>';

      try {
        // Get actual media files and folders from the selected folder
        const items = await window.electronAPI.getMediaFiles(folderPath);

        // Separate folders and files
        const folders = items.filter(item => item.isDirectory);
        const files = items.filter(item => !item.isDirectory);

        // Store all media files for filtering (only files, not folders)
        this.allMediaFiles = files;
        this.currentMediaFiles = files;

        // Clear loading message
        photoGrid.innerHTML = '';

        if (folders.length === 0 && files.length === 0) {
          photoGrid.innerHTML = '<div class="no-files">No folders or supported media files found in this folder.</div>';

          // Update toolbar state even for empty folders
          this.updateToolbarState();
          this.updateExportButtonText();
          this.updateCurrentPathDisplay();

          return;
        }

        // Create folder items first
        folders.forEach((folder, index) => {
          const folderItem = this.createFolderItem(folder, index);
          photoGrid.appendChild(folderItem);
        });

        // Create photo items for each file
        files.forEach((file, index) => {
          const photoItem = this.createPhotoItem(file, index);
          photoGrid.appendChild(photoItem);
        });

        // Load starred status for current files
        await this.updateStarredStatus(files.map(f => f.path));

        // Update toolbar state and path display
        this.updateToolbarState();
        this.updateExportButtonText();
        this.updateCurrentPathDisplay();

      } catch (error) {
        console.error('Error loading folder contents:', error);
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
    // Create clean, simple modal structure
    const modal = document.createElement('div');
    modal.id = 'imagePreviewModal';
    modal.className = 'preview-modal';
    modal.setAttribute('tabindex', '0'); // Make modal focusable
    modal.style.outline = 'none'; // Remove focus outline
    modal.innerHTML = `
      <div class="preview-backdrop" onclick="photoRenderer.closePreview()"></div>
      <div class="preview-container">
        <!-- Close button -->
        <button class="preview-close" onclick="photoRenderer.closePreview()" title="Close (ESC)">&times;</button>
        
        <!-- Navigation arrows -->
        <button class="nav-arrow nav-prev" onclick="photoRenderer.navigateImage(-1)" title="Previous (← or A) | Ctrl+← to skip back 10s in video">‹</button>
        <button class="nav-arrow nav-next" onclick="photoRenderer.navigateImage(1)" title="Next (→ or D) | Ctrl+→ to skip forward 10s in video">›</button>

        <!-- Main image/video area -->
        <div class="preview-media">
          <img id="previewImage" class="preview-image" alt="Preview" style="display: none;">
          <video id="previewVideo" class="preview-video" controls preload="metadata" style="display: none;">
            Your browser does not support the video element.
          </video>
        </div>

        <!-- Bottom control bar -->
        <div class="preview-controls">
          <div class="preview-info">
            <span id="previewTitle" class="preview-title">Image Title</span>
            <span id="previewIndex" class="preview-counter">1 of 1</span>
          </div>
          <div class="preview-actions">
            <button onclick="photoRenderer.toggleCurrentImageStar()" class="control-btn star-btn" id="previewStarButton" title="Star photo (S)">★</button>
            <div class="zoom-controls" id="zoomControls">
              <button onclick="photoRenderer.zoomOut()" class="control-btn" title="Zoom out (-)">−</button>
              <span id="zoomLevel" class="zoom-display">100%</span>
              <button onclick="photoRenderer.zoomIn()" class="control-btn" title="Zoom in (+)">+</button>
              <button onclick="photoRenderer.resetZoom()" class="control-btn" title="Reset zoom (0)">⌂</button>
            </div>
            <button onclick="photoRenderer.toggleFullscreen()" class="control-btn fullscreen-btn" title="Fullscreen (F)">⛶</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupPreviewEventListeners(modal);
  }

  setupPreviewEventListeners(modal) {
    // Keyboard shortcuts - use capture phase to intercept before video controls
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('imagePreviewModal');
      if (modal && modal.style.display === 'flex') {

        // Handle Ctrl+Arrow keys for video seeking (10 seconds)
        if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          switch (e.key) {
            case 'ArrowLeft':
              this.skipVideoBackward();
              e.preventDefault();
              e.stopPropagation();
              return;
            case 'ArrowRight':
              this.skipVideoForward();
              e.preventDefault();
              e.stopPropagation();
              return;
          }
        }

        // Check if any modifier keys are pressed - if so, don't intercept other keys
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
          return;
        }

        switch (e.key) {
          case 'Escape':
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              this.closePreview();
            }
            e.preventDefault();
            e.stopPropagation();
            break;
          case 'f':
          case 'F':
            this.toggleFullscreen();
            e.preventDefault();
            e.stopPropagation();
            break;
          case 's':
          case 'S':
            this.toggleCurrentImageStar();
            e.preventDefault();
            e.stopPropagation();
            break;
          case 'ArrowLeft':
            this.navigateImage(-1);
            e.preventDefault();
            e.stopPropagation();
            break;
          case 'a':
          case 'A':
            this.navigateImage(-1);
            e.preventDefault();
            e.stopPropagation();
            break;
          case 'ArrowRight':
            this.navigateImage(1);
            e.preventDefault();
            e.stopPropagation();
            break;
          case 'd':
          case 'D':
            this.navigateImage(1);
            e.preventDefault();
            e.stopPropagation();
            break;
          case '+':
          case '=':
            e.preventDefault();
            e.stopPropagation();
            this.zoomIn();
            break;
          case '-':
          case '_':
            e.preventDefault();
            e.stopPropagation();
            this.zoomOut();
            break;
          case '0':
            e.preventDefault();
            e.stopPropagation();
            this.resetZoom();
            break;
          case ' ':
            // Always handle spacebar for video play/pause
            e.preventDefault();
            e.stopPropagation();
            this.toggleVideoPlayPause();
            break;
        }
      }
    }, true); // Use capture phase to intercept before video controls

    // Additional keyup handler to prevent double space bar triggering
    document.addEventListener('keyup', (e) => {
      const modal = document.getElementById('imagePreviewModal');
      if (modal && modal.style.display === 'flex' && e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true); // Use capture phase

    // Focus management for video elements
    modal.addEventListener('click', (e) => {
      // When clicking anywhere in the modal, ensure focus stays on modal
      if (modal.style.display === 'flex') {
        modal.focus();
      }
    });

    // Prevent video controls from stealing keyboard focus
    modal.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'VIDEO') {
        // If video gets focus, redirect focus to modal container
        setTimeout(() => {
          modal.focus();
        }, 0);
      }
    });

    // Mouse wheel zoom for images
    modal.addEventListener('wheel', (e) => {
      if (modal.style.display === 'flex') {
        e.preventDefault();
        const previewImage = document.getElementById('previewImage');
        const isImageVisible = previewImage && previewImage.style.display !== 'none';

        if (isImageVisible) {
          if (e.deltaY < 0) {
            this.zoomIn();
          } else {
            this.zoomOut();
          }
        }
      }
    });

    // Mouse drag for panning
    const previewMedia = modal.querySelector('.preview-media');
    if (previewMedia) {
      previewMedia.addEventListener('mousedown', (e) => {
        const previewImage = document.getElementById('previewImage');
        const isImageVisible = previewImage && previewImage.style.display !== 'none';

        if (this.zoomLevel > 1 && isImageVisible) {
          this.isDragging = true;
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
          previewMedia.style.cursor = 'grabbing';
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
          previewMedia.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
        }
      });
    }

    // Fullscreen change handler
    document.addEventListener('fullscreenchange', () => {
      const modal = document.getElementById('imagePreviewModal');
      if (modal && modal.style.display === 'flex') {
        const fullscreenBtn = modal.querySelector('.fullscreen-btn');

        if (document.fullscreenElement) {
          modal.classList.add('fullscreen-mode');
          fullscreenBtn.textContent = '⛷';
          fullscreenBtn.title = 'Exit fullscreen (F)';
        } else {
          modal.classList.remove('fullscreen-mode');
          fullscreenBtn.textContent = '⛶';
          fullscreenBtn.title = 'Fullscreen (F)';
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

    // Pause any currently playing video before switching
    const previewVideo = document.getElementById('previewVideo');
    if (previewVideo && previewVideo.style.display !== 'none' && !previewVideo.paused) {
      previewVideo.pause();
      previewVideo.currentTime = 0; // Reset to beginning
    }

    this.currentImageIndex = index;
    const currentFile = this.currentMediaFiles[index];

    const modal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
    const previewTitle = document.getElementById('previewTitle');
    const previewIndex = document.getElementById('previewIndex');

    // Show modal
    modal.style.display = 'flex';

    // Ensure modal can receive focus
    modal.setAttribute('tabindex', '0');
    modal.focus();

    // Reset zoom and pan
    this.resetZoom();

    // Update UI
    this.updateNavigationButtons();
    this.updatePreviewStarButton();

    // Set file info
    previewTitle.textContent = currentFile.name;
    previewIndex.textContent = `${index + 1} of ${this.currentMediaFiles.length}`;

    // Hide both media elements initially
    previewImage.style.display = 'none';
    previewVideo.style.display = 'none';

    try {
      const result = await window.electronAPI.getImagePreview(currentFile.path);

      if (result.success && result.exists) {
        if (currentFile.type === 'video') {
          // Show video
          previewVideo.src = `file://${result.filePath}`;
          previewVideo.style.display = 'block';
          previewVideo.load();
          this.setZoomControlsVisibility(false);

          // Add video-specific event handlers to prevent conflicts
          previewVideo.addEventListener('keydown', (e) => {
            // Prevent video from handling our custom shortcuts, but allow Ctrl+Arrow for seeking
            if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
              // Let our handlers deal with Ctrl+Arrow for video seeking
              return;
            }
            // Prevent video from handling other custom shortcuts
            if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D', 'f', 'F', 's', 'S', ' ', 'Escape'].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }, true);

          // Ensure focus returns to modal after video interaction
          previewVideo.addEventListener('click', () => {
            setTimeout(() => {
              modal.focus();
            }, 10);
          });

        } else {
          // Show image  
          previewImage.src = `file://${result.filePath}`;
          previewImage.style.display = 'block';
          this.setZoomControlsVisibility(true);
        }
      } else {
        // Show error
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

  closePreview() {
    const modal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    modal.style.display = 'none';
    modal.classList.remove('fullscreen-mode');

    // Reset media elements
    previewImage.src = '';
    previewImage.style.display = 'none';

    if (previewVideo) {
      previewVideo.pause(); // Ensure video is paused
      previewVideo.currentTime = 0; // Reset to beginning
      previewVideo.src = ''; // Clear the source
      previewVideo.style.display = 'none';
      previewVideo.load(); // Reset the video element state
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

    if (prevBtn && nextBtn) {
      if (this.currentMediaFiles.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
      }
    }
  }

  toggleFullscreen() {
    const modal = document.getElementById('imagePreviewModal');

    if (!document.fullscreenElement) {
      modal.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
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

    if (isVideoVisible && previewVideo.readyState >= 2) { // Only if video is loaded
      const newTime = Math.max(0, previewVideo.currentTime - 10);
      previewVideo.currentTime = newTime;
      this.showSeekIndicator('-10s');
      console.log(`Video seeked backward to ${newTime.toFixed(1)}s`);
    }
  }

  skipVideoForward() {
    const previewVideo = document.getElementById('previewVideo');
    const isVideoVisible = previewVideo && previewVideo.style.display !== 'none';

    if (isVideoVisible && previewVideo.readyState >= 2) { // Only if video is loaded
      const duration = previewVideo.duration || 0;
      const newTime = Math.min(duration, previewVideo.currentTime + 10);
      previewVideo.currentTime = newTime;
      this.showSeekIndicator('+10s');
      console.log(`Video seeked forward to ${newTime.toFixed(1)}s`);
    }
  }

  showSeekIndicator(text) {
    const modal = document.getElementById('imagePreviewModal');
    if (!modal) return;

    // Remove existing indicator
    const existing = modal.querySelector('.seek-indicator');
    if (existing) {
      existing.remove();
    }

    // Create seek indicator
    const indicator = document.createElement('div');
    indicator.className = 'seek-indicator';
    indicator.textContent = text;
    indicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 18px;
      font-weight: bold;
      z-index: 1003;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;

    modal.appendChild(indicator);

    // Remove after 1 second
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.remove();
          }
        }, 300);
      }
    }, 700);
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

  createFolderItem(folder, index) {
    const folderItem = document.createElement('div');
    folderItem.className = 'folder-item';

    folderItem.innerHTML = `
      <div class="folder-icon">
        <span class="folder-emoji">📁</span>
      </div>
      <div class="folder-info">
        <div class="folder-name" title="${folder.name}">${folder.name}</div>
        <div class="folder-details">
          <span class="folder-type">FOLDER</span>
        </div>
      </div>
    `;

    // Add click handler for folder navigation
    folderItem.addEventListener('click', (e) => {
      // Don't navigate if clicking on something else
      if (!e.target.closest('.folder-icon') && !e.target.closest('.folder-info')) {
        return;
      }
      this.navigateToFolder(folder.path);
    });

    folderItem.style.cursor = 'pointer';
    folderItem.title = `Click to open folder: ${folder.name}`;

    return folderItem;
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
    this.currentFolderPath = null;
    this.folderHistory = [];

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

  navigateToFolder(folderPath) {
    console.log('Navigating to folder:', folderPath);

    // Add current folder to history if we have one
    if (this.currentFolderPath) {
      this.folderHistory.push(this.currentFolderPath);
    }

    // Load the new folder
    this.loadPhotosFromFolder(folderPath);
  }

  goBackFolder() {
    if (this.folderHistory.length > 0) {
      const previousFolder = this.folderHistory.pop();
      console.log('Going back to folder:', previousFolder);
      this.loadPhotosFromFolder(previousFolder);
    }
  }

  updateCurrentPathDisplay() {
    // Update the toolbar to show current path
    const pathDisplay = document.getElementById('current-path');
    const backFolderBtn = document.getElementById('back-folder-btn');

    if (pathDisplay && this.currentFolderPath) {
      // Create breadcrumb path
      const pathParts = this.currentFolderPath.split(/[/\\]/).filter(p => p);
      const breadcrumbs = pathParts.map((part, index) => {
        const fullPath = pathParts.slice(0, index + 1).join('/');
        return `<span class="breadcrumb" data-path="${fullPath}">${part}</span>`;
      }).join(' / ');

      pathDisplay.innerHTML = `<span class="path-label">Current:</span> ${breadcrumbs}`;

      // Add click handlers for breadcrumbs
      pathDisplay.querySelectorAll('.breadcrumb').forEach(breadcrumb => {
        breadcrumb.addEventListener('click', () => {
          const path = breadcrumb.dataset.path;
          this.navigateToFolder(path);
        });
      });
    } else if (pathDisplay) {
      pathDisplay.innerHTML = '';
    }

    // Show/hide back folder button
    if (backFolderBtn) {
      backFolderBtn.style.display = this.folderHistory.length > 0 ? 'flex' : 'none';
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
    const previewMedia = document.querySelector('.preview-media');

    if (previewImage && previewImage.style.display !== 'none') {
      previewImage.style.transform = `scale(${this.zoomLevel}) translate(${this.panX / this.zoomLevel}px, ${this.panY / this.zoomLevel}px)`;
      previewImage.style.transformOrigin = 'center center';
    }

    if (previewMedia) {
      previewMedia.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
    }
  }

  updateZoomControls() {
    const zoomDisplay = document.getElementById('zoomLevel');

    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
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

  toggleVideoPlayPause() {
    const previewVideo = document.getElementById('previewVideo');
    const isVideoVisible = previewVideo && previewVideo.style.display !== 'none';

    if (isVideoVisible && previewVideo.readyState >= 2) { // Only if video is loaded
      if (previewVideo.paused) {
        previewVideo.play().catch(err => {
          console.error('Error playing video:', err);
        });
      } else {
        previewVideo.pause();
      }
    }
  }

  updatePreviewStarButton() {
    if (this.currentImageIndex < 0 || this.currentImageIndex >= this.currentMediaFiles.length) {
      return;
    }

    const currentFile = this.currentMediaFiles[this.currentImageIndex];
    const isStarred = this.starredPhotosCache.has(currentFile.path);
    const starButton = document.getElementById('previewStarButton');

    if (starButton) {
      if (isStarred) {
        starButton.classList.add('starred');
        starButton.style.color = '#f39c12';
        starButton.title = 'Remove from starred photos (S)';
      } else {
        starButton.classList.remove('starred');
        starButton.style.color = '';
        starButton.title = 'Star photo (S)';
      }
    }
  }

  setZoomControlsVisibility(visible) {
    const zoomControls = document.getElementById('zoomControls');
    if (zoomControls) {
      zoomControls.style.display = visible ? 'flex' : 'none';
    }
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
