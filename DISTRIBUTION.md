# Photo Selector - AppImage Distribution

## About
Photo Selector is a simple and elegant desktop application for selecting and organizing your photos and videos. Built with Electron and TypeScript, it provides a clean interface for browsing, starring, and exporting your media files.

## Features
- 🖼️ Browse images and videos in a beautiful grid layout
- ⭐ Star your favorite photos and videos
- 🔍 Filter to show only starred items
- 📤 Export starred items to any directory
- 🖱️ Zoom and pan functionality for images
- ⌨️ Comprehensive keyboard shortcuts
- 🎥 Native video playback support
- 💾 Cross-platform SQLite database storage

## Installation (Ubuntu/Linux)

### AppImage (Recommended)
1. Download the latest `Photo Selector-1.0.0.AppImage` from the releases
2. Make it executable: `chmod +x "Photo Selector-1.0.0.AppImage"`
3. Run it: `./Photo\ Selector-1.0.0.AppImage`

The AppImage is self-contained and includes all dependencies. It works on most Linux distributions.

### System Requirements
- Linux x64 (Ubuntu 18.04+ or equivalent)
- Minimum 4GB RAM
- 200MB free disk space

## Usage
1. Launch Photo Selector
2. Click "Select Folder" to choose a directory containing your photos/videos
3. Browse through your media using the grid view
4. Click the star button to mark favorites
5. Use the filter button to show only starred items
6. Export starred items using the export button

### Keyboard Shortcuts
- `←/→` - Navigate between photos
- `Space/Shift+Space` - Navigate forward/backward
- `S` - Toggle star on current photo
- `+/-` - Zoom in/out (images only)
- `Escape` - Close preview or go back to home

## Database Location
The application stores your starred items in a SQLite database located at:
`~/.photo-selector/photo-selector.db`

## Development
Built with:
- Electron 37.x
- TypeScript 5.x
- SQLite3
- HTML5/CSS3

## License
ISC License - see LICENSE file for details.
