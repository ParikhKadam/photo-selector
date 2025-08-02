# Photo Selector v1.1.0 Release Notes

## 🚀 Performance & User Experience Update

This release focuses on significant performance improvements and enhanced user experience with better keyboard controls and streamlined interface.

### ✨ What's New in v1.1.0

#### 🎯 Performance Improvements
- **Smooth Touchpad Zoom**: Completely redesigned zoom handling for real-time touchpad responsiveness
- **Optimized Event Processing**: Intelligent throttling prevents lag during zoom operations
- **Hardware Acceleration**: GPU-accelerated CSS transforms for buttery smooth image scaling
- **Smart Event Detection**: Automatic differentiation between touchpad and mouse wheel inputs

#### ⌨️ Enhanced Keyboard Controls
- **Smart ESC Handling**: ESC now exits fullscreen first, then closes preview (two-step behavior)
- **Video Playback Shortcuts**: 
  - Spacebar to toggle play/pause
  - Ctrl+Left/Right arrows to skip backward/forward 10 seconds
- **Fullscreen Sync**: All fullscreen toggles (F11, menu, F key) now sync UI properly

#### 🎨 Interface Improvements  
- **Streamlined Toolbar**: Removed redundant "Show All" button - "Starred Only" now works as intuitive toggle
- **Visual Feedback**: Better button states and hover effects
- **Cleaner Navigation**: Simplified toolbar with essential controls only

#### 🐛 Bug Fixes
- Fixed zoom lag issues that occurred after scroll conflict resolution
- Fixed ESC key behavior in fullscreen mode
- Fixed Ctrl+Arrow key conflicts with media navigation
- Improved event handling order for better keyboard shortcut reliability

---

# Photo Selector v1.0.0 Release Notes

## 🎉 Initial Release - Photo and Video Management Made Simple

Photo Selector is a cross-platform desktop application built with Electron and TypeScript for organizing and managing your photo and video collections.

### ✨ Key Features

#### Media Management
- **Universal Media Support**: Browse both images and videos in one interface
- **Smart Thumbnails**: Grid view with thumbnails for all supported media types
- **Star System**: Mark favorite photos and videos with an intuitive star rating
- **Smart Filtering**: Filter to show only starred items in any folder
- **One-Click Export**: Export all starred media to any destination folder

#### Image Features
- **High-Quality Preview**: Double-click for full-resolution image preview
- **Zoom & Pan**: Mouse wheel zoom with click-and-drag panning
- **Keyboard Zoom**: +/- keys for precise zoom control

#### Video Features
- **Native Playback**: HTML5 video player with full controls
- **Multiple Formats**: Support for MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP
- **Preview Integration**: Videos open seamlessly in the same preview interface

#### User Experience
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Modern UI**: Clean glassmorphism design with responsive layouts
- **Cross-Platform Database**: SQLite storage in user home directory
- **Persistent State**: Your starred items are saved between sessions

### 🛠️ Technical Specifications

- **Framework**: Electron 37.x with TypeScript 5.x
- **Database**: SQLite3 with cross-platform file paths
- **Security**: Context isolation with secure IPC communication
- **Performance**: Native desktop performance with hardware acceleration

### 📦 Distribution

#### Linux AppImage (Recommended)
- **File**: `Photo Selector-1.0.0.AppImage` (117MB)
- **Installation**: Download, make executable, and run
- **Compatibility**: Ubuntu 18.04+ or equivalent x64 systems
- **Dependencies**: Self-contained, no additional installation required

### 📋 System Requirements

**Runtime Requirements:**
- Linux x64 (Ubuntu 18.04+ or equivalent)
- 4GB RAM minimum
- 200MB free disk space
- Hardware acceleration recommended for video playback

### 🗂️ Supported File Formats

**Images**: JPG, JPEG, PNG, GIF, BMP, WebP, SVG, TIFF, TIF
**Videos**: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP

### ⌨️ Keyboard Shortcuts

- `Ctrl+O` - Open folder
- `←/→` - Navigate between media
- `Space/Shift+Space` - Navigate forward/backward
- `S` - Toggle star on current item
- `+/-` - Zoom in/out (images only)
- `Ctrl+Shift+S` - View starred collection
- `Ctrl+H` - Return to home
- `Escape` - Close preview/return to home

### 💾 Database Location

Your starred items are stored in a SQLite database at:
- **Linux**: `~/.photo-selector/photo-selector.db`

### 📖 Installation Instructions

1. Download `Photo Selector-1.0.0.AppImage` from the release assets
2. Make it executable: `chmod +x "Photo Selector-1.0.0.AppImage"`
3. Run it: `./Photo Selector-1.0.0.AppImage`

### 🐛 Known Issues

None reported for this initial release.

### 🤝 Contributing

This is an open-source project. Contributions, bug reports, and feature requests are welcome through GitHub issues and pull requests.

### 📄 License

ISC License - see LICENSE file for details.

---

**Full Changelog**: https://github.com/ParikhKadam/photo-selector/commits/v1.0.0
