# Photo Selector v1.2.5 Release Notes

## ⌨️ Extended Keyboard Navigation - A/D Keys Support

This release extends keyboard navigation capabilities by adding support for A and D keys, providing users with even more flexible navigation options that are commonly used in gaming and media applications.

### ✨ What's New in v1.2.5

#### ⌨️ Extended Keyboard Navigation
- **A/D Key Support**: Added `A` and `D` keys as navigation alternatives (both lowercase and uppercase)
- **Gaming-Style Controls**: Familiar A/D controls for users accustomed to gaming navigation
- **Multiple Navigation Methods**: Users now have 3 different key sets: arrows (`←/→`), brackets (`< >`), and A/D keys
- **Case-Insensitive**: Both `a`/`A` and `d`/`D` keys work identically

#### 🎯 Enhanced User Experience
- **Flexible Preferences**: Choose from arrow keys, bracket keys, or A/D keys based on personal preference
- **Updated Tooltips**: Navigation buttons now show "Previous (← or A)" and "Next (→ or D)"
- **Comprehensive Documentation**: README updated with all available navigation methods
- **Intuitive Controls**: A/D keys provide left/right navigation that's intuitive for many users

### 🔧 Technical Implementation

#### Keyboard Event Handling
- **Extended Key Detection**: Added `a`, `A`, `d`, `D` key handlers in keyboard event listeners
- **Unified Navigation**: All key sets trigger the same `navigateImage()` function
- **Event Management**: Proper event prevention to avoid conflicts with video controls

#### UI Updates
- **Tooltip Enhancement**: Navigation button titles updated to show A/D key options
- **Documentation Update**: README.md reflects all available keyboard navigation methods
- **User Guidance**: Clear indication of multiple navigation options available

### ✅ Verification
- `A` key navigates to previous media (same as `←` and `<`)
- `D` key navigates to next media (same as `→` and `>`)
- Case-insensitive operation (both `a`/`A` and `d`/`D` work)
- Tooltips show all available key options
- No conflicts with existing shortcuts
- Works across all media types (images and videos)

---

# Photo Selector v1.2.4 Release Notes

## ⌨️ Enhanced Keyboard Navigation & Accessibility

This release introduces enhanced keyboard navigation options, providing users with multiple ways to navigate through media files using both arrow keys and alternative bracket keys for improved accessibility and user preference.

### ✨ What's New in v1.2.4

#### ⌨️ Enhanced Keyboard Navigation
- **Dual Navigation Keys**: Added support for `<` and `>` keys as alternatives to `←` and `→` arrow keys
- **Improved Accessibility**: Multiple navigation options cater to different keyboard layouts and user preferences
- **Consistent Behavior**: Both key sets provide identical navigation functionality
- **Visual Feedback**: Navigation button tooltips updated to reflect both key options

#### 🎯 User Experience Improvements
- **Flexible Controls**: Users can choose between arrow keys or bracket keys based on preference
- **Enhanced Tooltips**: Navigation buttons now show both arrow and bracket key options
- **Seamless Integration**: New keys integrate seamlessly with existing keyboard shortcuts
- **No Conflicts**: Bracket keys don't interfere with existing functionality

### 🔧 Technical Implementation

#### Keyboard Event Handling
- **Extended Key Detection**: Added `<` and `>` key handlers in keyboard event listeners
- **Unified Navigation**: Both key sets trigger the same `navigateImage()` function
- **Event Prevention**: Proper event handling prevents conflicts with video controls and other elements

#### UI Updates
- **Tooltip Enhancement**: Navigation button titles updated to show both key options
- **Documentation Update**: README.md updated with new keyboard shortcut information
- **Consistent Messaging**: All user-facing text reflects the dual navigation options

### ✅ Verification
- `<` key navigates to previous media (same as `←`)
- `>` key navigates to next media (same as `→`)
- Tooltips show both key options
- No conflicts with existing shortcuts
- Works across all media types (images and videos)

---

# Photo Selector v1.2.3 Release Notes

## 🐛 Folder Navigation Bug Fixes & UX Improvements

This patch release addresses critical bugs in the folder navigation system and improves the overall user experience when browsing through directories and navigating between media files.

### 🐛 Bug Fixes

#### 📁 Folder Navigation Fixes
- **Fixed**: Back button visibility in empty subfolders - navigation controls now remain accessible even when folders contain no media files
- **Fixed**: File selection indexing - clicking on a photo now correctly opens that specific file in the viewer instead of starting from the beginning
- **Fixed**: Navigation state consistency - toolbar buttons and navigation controls now properly reflect the current folder state

#### 🎯 User Experience Improvements
- **Enhanced**: Empty folder handling - users can now navigate back from empty folders without losing navigation context
- **Improved**: File selection feedback - visual selection indicators work correctly across all folder navigation scenarios
- **Optimized**: Navigation state updates - toolbar and controls update immediately when entering or leaving folders

### 🔧 Technical Details

#### Navigation State Management
- **Fixed**: `updateToolbarState()` now called consistently for empty folders
- **Fixed**: Back button display logic accounts for folder history in all scenarios
- **Fixed**: File indexing ensures selected file opens in viewer, not first file in list

#### UI State Synchronization
- **Enhanced**: Toolbar button visibility logic for different folder states
- **Improved**: Visual feedback for file selection across navigation contexts
- **Optimized**: State updates prevent UI inconsistencies during folder transitions

### ✅ Verification
- Back button appears correctly in empty folders
- Clicking photos opens the correct file in viewer
- Navigation controls remain functional across all folder scenarios
- UI state stays consistent during folder browsing

---

# Photo Selector v1.2.2 Release Notes

## 📁 Folder Navigation & Enhanced File Management

This release introduces comprehensive folder navigation capabilities, allowing users to browse through directories, navigate back to previous folders, and maintain navigation history for a more intuitive file browsing experience.

### ✨ What's New in v1.2.2

#### 📁 Folder Navigation System
- **Open Folder Button**: New prominent "Open Photo Folder" button for easy folder selection
- **Back Navigation**: "Back" button to navigate to the previous folder in the browsing history
- **Folder History Tracking**: Maintains navigation history for seamless folder traversal
- **Current Folder Tracking**: Displays and tracks the currently opened folder path
- **Enhanced File Loading**: Improved file loading from selected folders with better error handling

#### 🎨 User Interface Improvements
- **Navigation Toolbar**: Added dedicated navigation buttons in the toolbar
- **Visual Feedback**: Clear visual indicators for navigation actions
- **Responsive Design**: Navigation elements adapt to different screen sizes
- **Intuitive Layout**: Logical placement of folder navigation controls

#### 🔧 Technical Enhancements
- **IPC Communication**: Enhanced inter-process communication for folder operations
- **State Management**: Improved state tracking for folder navigation and history
- **Error Handling**: Better error handling for folder access and file loading operations
- **Performance Optimization**: Efficient folder scanning and file enumeration

### 🐛 Bug Fixes & Improvements
- **Fixed**: Folder navigation state persistence across app sessions
- **Fixed**: Navigation history clearing when opening new folders
- **Enhanced**: File loading performance for large directories
- **Improved**: Error messages for inaccessible folders or files

### 🔧 Technical Implementation
- **Main Process**: Added folder dialog handling and directory scanning
- **Renderer Process**: Implemented navigation UI and state management
- **IPC Handlers**: New IPC channels for folder operations and navigation
- **Database Integration**: Folder paths stored for quick access and history

---

# Photo Selector v1.2.1 Release Notes

## 🛠️ Critical Bug Fix - Sharp Library AppImage Support

This patch release fixes a critical issue with the Linux AppImage distribution where the Sharp image processing library failed to load, preventing the application from working properly.

### 🐛 Bug Fixes

#### 🔧 Sharp Library Bundling Issue
- **Fixed**: `libvips-cpp.so.8.17.3: cannot open shared object file` error in AppImage builds
- **Root Cause**: Sharp's native dependencies weren't being properly unpacked from the ASAR archive
- **Solution**: Updated `asarUnpack` configuration to include both `sharp` and `@img/*` packages
- **Impact**: AppImage builds now work correctly on Linux systems

#### 📦 Build System Improvements
- **Added**: `afterPack.js` hook to verify native dependencies are properly bundled
- **Updated**: Build script to remove unnecessary Sharp rebuild steps
- **Enhanced**: Build verification with diagnostic output for troubleshooting

### 🔧 Technical Details

#### Electron Builder Configuration
```json
"asarUnpack": [
  "**/node_modules/sharp/**/*",
  "**/node_modules/@img/**/*"
]
```
- Ensures all Sharp-related native binaries are unpacked from ASAR
- Includes platform-specific `@img/*` packages containing libvips binaries

#### Build Verification
- Added `afterPack.js` script to validate Sharp and @img packages are properly unpacked
- Provides diagnostic output during the build process
- Helps prevent similar bundling issues in future releases

### ✅ Verification
- AppImage launches successfully without Sharp errors
- Image processing and thumbnail generation work correctly
- Database initialization and all core features functional

---

# Photo Selector v1.2.0 Release Notes

## 🎬 Preview System Overhaul & Video Experience Enhancement

This release features a complete rewrite of the preview system with focus on optimal screen space utilization, improved video playback experience, and enhanced user interface.

### ✨ What's New in v1.2.0

#### 🖼️ Completely Redesigned Preview System
- **Fixed-Size Preview Container**: Preview pane now uses a fixed size (90% viewport) instead of expanding to image dimensions
- **Optimal Screen Utilization**: Images and videos now properly fit within the preview container for consistent viewing experience
- **Simplified Architecture**: Complete ground-up rebuild of the preview modal system for better maintainability and performance
- **Enhanced Focus Management**: Improved keyboard shortcut handling with proper event capture to prevent conflicts

#### 🎬 Enhanced Video Experience
- **Smart Video Controls**: Resolved keyboard shortcut conflicts between application navigation and video player controls
- **Advanced Video Seeking**: Ctrl+Arrow keys now seek backward/forward by 10 seconds with visual feedback indicators
- **Automatic Audio Management**: Videos automatically pause when navigating to prevent background audio interference
- **Improved Video Control Interaction**: Better focus management ensures keyboard shortcuts work consistently after video interaction

#### ⌨️ Refined Keyboard Controls
- **Conflict Resolution**: Fixed Space bar and Ctrl+Arrow key conflicts with native video controls
- **Event Capture System**: Implemented proper event capture phase handling for reliable shortcut processing
- **Visual Seeking Feedback**: Added fade-in/fade-out indicators when seeking through videos
- **Consistent Navigation**: Arrow keys work reliably for media navigation regardless of video control focus

#### 🎨 User Interface Improvements
- **Streamlined Design**: Reduced CSS complexity from 1432 to 717 lines while maintaining full functionality
- **Better Video Thumbnails**: Improved video overlay handling - controls no longer interfere with thumbnail display
- **Performance Optimization**: Enhanced thumbnail generation for faster loading and smoother browsing experience
- **Responsive Layout**: Better handling of different screen sizes and aspect ratios

#### 🐛 Critical Bug Fixes
- **Fixed**: Background video audio continuing when navigating between media items
- **Fixed**: Keyboard shortcuts not working after interacting with video controls
- **Fixed**: Preview container expanding beyond optimal size for large images
- **Fixed**: Video control overlay interfering with thumbnail generation and display
- **Fixed**: Focus management issues causing inconsistent keyboard behavior

#### 🚀 Performance & Technical Improvements
- **Efficient Thumbnail Generation**: Optimized image and video thumbnail creation for better performance
- **Cleaner Codebase**: Simplified preview system architecture with better separation of concerns
- **Improved Error Handling**: Better fallback mechanisms for media loading failures
- **Enhanced Memory Management**: Proper cleanup of video elements to prevent memory leaks

---

# Photo Selector v1.1.1 Release Notes

## 🎯 Cross-Platform Release & Build System

This release introduces a comprehensive automated build system for cross-platform distribution, enabling Windows and macOS support alongside Linux.

### ✨ What's New in v1.1.1

#### 🏗️ Cross-Platform Build System
- **GitHub Actions Automation**: Fully automated cross-platform builds for Linux, Windows, and macOS
- **Professional Release Management**: Unified releases with properly named assets across all platforms
- **Windows Support**: Both NSIS installer and portable executables
- **macOS Support**: Universal DMG packages for Intel and Apple Silicon Macs
- **Linux AppImage**: Continued support with automated building

#### 📦 Distribution Improvements
- **Standardized Naming**: Consistent asset naming across all platforms
- **Release Automation**: One-click releases triggered by git tags
- **Build Matrix**: Simultaneous builds on multiple platforms for faster releases
- **Asset Management**: Automated upload and organization of release files

#### 🔧 Technical Enhancements
- **electron-builder Optimization**: Refined configuration for better cross-platform compatibility
- **Version Synchronization**: Dynamic version management from git tags
- **Build Performance**: Optimized build process with parallel execution
- **Security**: Enhanced GitHub Actions permissions and token management

---

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
