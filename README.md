# Photo Selector

A simple and elegant desktop application for browsing, selecting, and organizing your photo and video collection. Built with Electron and TypeScript.

![Photo Selector](https://img.shields.io/badge/electron-37.x-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.x-blue) ![License](https://img.shields.io/badge/license-ISC-green)

## Demo

See how easy it is to use Photo Selector! This demo shows the complete workflow from opening a folder to starring your favorite photos and videos:

![Photo Selector Demo](usage/v1.1.1.gif)

**What you see in the demo:**
- 📂 Opening a folder with mixed media (photos, videos, documents)
- 🔍 Browsing through thumbnails in grid view
- ⭐ Starring favorite photos and videos with one click
- 🎯 Filtering to show only starred items
- 🖼️ Full-resolution preview with zoom and pan
- 🎥 Video playback with native controls

## Features

- 🖼️ **Photo & Video Browsing**: Browse both images and videos from any folder on your computer
- 🔍 **High-Quality Preview**: Double-click images for full-resolution preview with zoom and pan capabilities
- 🎥 **Video Playback**: Native HTML5 video player with full controls
- ⭐ **Star/Shortlist Media**: Mark your favorite photos and videos with star ratings for easy access
- 🔽 **Smart Filtering**: Filter to show only starred items in any folder
- 📤 **Export Starred Items**: Copy all your starred photos and videos to any destination folder
- 🔍 **Zoom & Pan**: Mouse wheel zoom and drag-to-pan for detailed image inspection
- 🎨 **Modern UI**: Clean, modern interface with glassmorphism design
- ⚡ **Fast Performance**: Built on Electron for native desktop performance
- 🧭 **Comprehensive Navigation**: Navigate through media using arrow keys, mouse wheel, or buttons
- ⌨️ **Keyboard Shortcuts**: Full keyboard support for efficient navigation
- 🔒 **Secure**: Implements Electron security best practices
- 📱 **Responsive**: Adapts to different window sizes
- 💾 **Persistent Storage**: Stars are saved in a cross-platform SQLite database

## Installation

Download the latest release from the [Releases page](https://github.com/ParikhKadam/photo-selector/releases).

### Windows
- **Installer**: `Photo.Selector.Setup.x.x.x.exe` (recommended)
- **Portable**: `Photo.Selector.x.x.x.exe`

### macOS
- Download `Photo.Selector-x.x.x.dmg`
- Drag to Applications folder

### Linux
- Download `Photo.Selector-x.x.x.AppImage`
- Make executable: `chmod +x Photo.Selector-x.x.x.AppImage`

### Development Setup
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

## Usage

1. **Open Folder**: Ctrl+O to select a media folder
2. **Browse Media**: View thumbnails in grid, double-click to preview
3. **Star Favorites**: Click star button (★) or press 'S' key
4. **Filter**: Use "Show Starred Only" to see favorites
5. **Export**: Copy starred media to any folder

### Keyboard Shortcuts
- `←/→` or `< >` - Navigate between media
- `S` - Star/unstar current item
- `+/-` - Zoom in/out (images)
- `Ctrl+O` - Open folder
- `Ctrl+Shift+S` - View starred collection
- `ESC` - Close preview

## Development

```bash
npm install          # Install dependencies
npm run dev         # Run in development mode
npm run build       # Build TypeScript
npm run dist        # Create distribution files
```

## Supported File Formats

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)
- SVG (.svg)
- TIFF (.tiff, .tif)

### Videos
- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)
- MKV (.mkv)
- M4V (.m4v)
- 3GP (.3gp)

## Project Structure

```
photo-selector/
├── src/
│   ├── main.ts          # Main Electron process
│   ├── preload.ts       # Preload script for secure IPC
│   └── database.ts      # SQLite database management
├── renderer/
│   ├── index.html       # Main UI
│   ├── styles.css       # Styling with glassmorphism design
│   └── renderer.js      # Renderer process logic
├── build/
│   └── icon.svg         # Application icon
├── dist/                # Compiled TypeScript output
├── release/             # Distribution files (AppImage, etc.)
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
├── build-appimage.sh    # Build script for AppImage
├── LICENSE              # ISC License
└── DISTRIBUTION.md      # Distribution guide
```

## Technical Details

**Built with**: Electron 37.x, TypeScript 5.x, SQLite3  
**Data Storage**: Cross-platform SQLite database in user home directory  
**Security**: Context isolation enabled, secure IPC communication

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes and test with `npm run dev`
4. Commit and push your changes
5. Open a Pull Request
