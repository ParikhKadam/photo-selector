# Photo Selector

A simple and elegant desktop application for browsing, selecting, and organizing your photo and video collection. Built with Electron and TypeScript.

![Photo Selector](https://img.shields.io/badge/electron-37.x-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.x-blue) ![License](https://img.shields.io/badge/license-ISC-green)

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
- 📦 **Distribution Ready**: Available as AppImage for Linux systems

## Installation

### Linux (AppImage) - Recommended
1. Download the latest `Photo Selector-1.0.0.AppImage` from releases
2. Make it executable: `chmod +x "Photo Selector-1.0.0.AppImage"`
3. Run it: `./Photo\ Selector-1.0.0.AppImage`

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

### Basic Operations
- **Open Folder**: Use Ctrl+O or File menu to select a media folder
- **View Thumbnails**: All images and videos in the folder will be displayed as thumbnails
- **Preview Media**: Double-click any thumbnail to open full preview (images support zoom/pan)
- **Video Playback**: Videos play with native HTML5 controls (play, pause, seek, volume)
- **Star Media**: Click the star button (★) on any photo or video to add it to your favorites
- **Filter Media**: Use the "Show Starred Only" button in the toolbar to filter to starred items
- **Export Starred**: Use the "Export Starred" button to copy all starred media to a folder
- **View Starred Collection**: Use Ctrl+Shift+S or File menu to view all starred items
- **Back to Home**: Use the Home button, Escape key, Ctrl+H, or File menu to return to welcome screen

### Star/Shortlist Features
- **Grid View Starring**: Hover over any media item to see the star button, click to star/unstar
- **Preview Starring**: In preview mode, use the Star button or press 'S' key
- **Universal Support**: Works with both images and videos seamlessly
- **Smart Filtering**: Use the "Show Starred Only" button to filter current folder to starred items
- **Starred Collection**: Access all your starred media via the File menu or Ctrl+Shift+S
- **Export Functionality**: Copy all starred photos and videos to any folder with the "Export Starred" button
- **Persistent Storage**: Starred items are saved to a local database in your home directory
- **Cross-Platform**: Database location adapts to your operating system (Windows/Mac/Linux)

### Image Preview Features
- **Zoom Controls**: Mouse wheel to zoom in/out on images
- **Pan Support**: Click and drag to pan around zoomed images
- **Keyboard Zoom**: Use +/- keys to zoom in/out
- **Smooth Navigation**: Arrow keys or navigation buttons to browse images
- **No Zoom Conflicts**: Zoom and navigation are properly separated

### Video Support
- **Native Playback**: Full HTML5 video player with standard controls
- **Supported Formats**: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP
- **Preview Thumbnails**: Video files show as thumbnails in grid view
- **Double-click to Play**: Double-click video thumbnails to open in preview mode
- **Star Videos**: Videos can be starred just like images

### Export Features
- **Universal Export**: Export both starred photos and videos
- **One-Click Export**: Export all starred media with a single button click
- **Smart Naming**: Automatically handles duplicate filenames by appending numbers
- **Progress Feedback**: Visual feedback during export process

- **Error Handling**: Detailed reporting of successful and failed exports
- **Folder Selection**: Choose any destination folder for your exported media

### Keyboard Shortcuts
- **Navigation**:
  - `←` / `→` Arrow keys to navigate between media items
  - `Space` / `Shift+Space` Navigate forward/backward through media
- **Media Control**:
  - `S` key to star/unstar current item (works for both images and videos)
  - `+` / `-` keys to zoom in/out (images only)
- **Application Control**:
  - `ESC` key to close preview or return to home
  - `Ctrl+O` to open folder
  - `Ctrl+H` to return to home screen
  - `Ctrl+Shift+S` to view starred collection
- **Preview Features**:
  - Mouse wheel for zoom (images) - navigation disabled in preview to prevent conflicts
  - Click and drag to pan around zoomed images

### Media Counter
Shows current position in preview mode (e.g., "3 of 12 items") for both images and videos.

## Development

### Development Scripts
```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Clean build directory
npm run clean
```

### Building for Distribution

#### Linux AppImage
```bash
# Build AppImage for Linux distribution
npm run dist:appimage

# Or use the provided build script
./build-appimage.sh
```

#### All Platforms
```bash
# Create application package (no installer)
npm run pack

# Create installer/executable for current platform
npm run dist

# Create for specific platform
npm run dist:linux
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

## Architecture

### Main Process (`src/main.ts`)
- Creates and manages application windows
- Handles system integration (menus, file dialogs)
- Manages application lifecycle

### Preload Script (`src/preload.ts`)
- Provides secure bridge between main and renderer processes
- Exposes limited APIs via `contextBridge`
- Maintains security isolation

### Renderer Process (`renderer/`)
- Handles user interface and interactions
- Communicates with main process via exposed APIs
- Renders photo grid and handles selections

## Database and Storage

The application stores starred media information in a SQLite database located at:
- **Linux**: `~/.photo-selector/photo-selector.db`
- **macOS**: `~/.photo-selector/photo-selector.db`
- **Windows**: `%USERPROFILE%\.photo-selector\photo-selector.db`

The database automatically:
- Creates the necessary directory structure on first run
- Stores media metadata (path, name, size, type, star date)
- Maintains data persistence across application restarts
- Handles cleanup of non-existent files when accessing starred media
- Works with both images and videos seamlessly
- Uses cross-platform file paths for maximum compatibility

## Architecture

### Main Process (`src/main.ts`)
- Creates and manages application windows
- Handles system integration (menus, file dialogs)
- Manages application lifecycle
- Provides file system operations
- Handles media file scanning and type detection

### Database Layer (`src/database.ts`)
- SQLite database management
- CRUD operations for starred media
- Cross-platform storage location handling
- Automatic cleanup of non-existent files

### Preload Script (`src/preload.ts`)
- Provides secure bridge between main and renderer processes
- Exposes limited APIs via `contextBridge`
- Maintains security isolation

### Renderer Process (`renderer/`)
- Handles user interface and interactions
- Media grid display with thumbnails
- Image preview with zoom/pan capabilities
- Video playback with HTML5 controls
- Star management and filtering
- Communicates with main process via exposed APIs

## Security

This application follows Electron security best practices:
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Secure IPC communication via preload script
- ✅ Content Security Policy implemented
- ✅ Local SQLite database with no network access
- ✅ File system access restricted to main process only

## Technologies Used

- **Electron 37.x**: Cross-platform desktop app framework
- **TypeScript 5.x**: Type-safe JavaScript development
- **SQLite3**: Local database for storing starred media metadata
- **Node.js**: Backend runtime for main process
- **HTML5**: Modern web standards for UI and video playback
- **CSS3**: Glassmorphism design with responsive layouts
- **Electron Builder**: Application packaging and distribution

## System Requirements

### Runtime Requirements
- **Linux**: Ubuntu 18.04+ or equivalent (x64)
- **Memory**: Minimum 4GB RAM
- **Storage**: 200MB free disk space
- **Graphics**: Hardware acceleration recommended for smooth video playback

### Development Requirements
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **Python**: v3.6+ (for native module compilation)
- **Build tools**: gcc/g++ (Linux), Xcode (macOS), Visual Studio Build Tools (Windows)

## Development Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run in development mode with DevTools
- `npm start` - Run production build
- `npm run clean` - Clean build and release directories
- `npm run pack` - Package for current platform
- `npm run dist` - Create distribution files for all configured targets
- `npm run dist:linux` - Create Linux-specific distribution
- `npm run dist:appimage` - Create AppImage for Linux
- `./build-appimage.sh` - Automated AppImage build script

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (run `npm run dev` to test the application)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain Electron security standards
- Test on multiple platforms when possible
- Update documentation for new features
- Ensure backward compatibility for database schema

## Support

- **Issues**: Create an issue in the GitHub repository
- **Documentation**: See [DISTRIBUTION.md](DISTRIBUTION.md) for distribution-specific information
- **Development**: Check the project structure and architecture sections above

## Changelog

### v1.0.0
- ✅ Initial release with photo browsing and starring
- ✅ SQLite database integration
- ✅ Export functionality
- ✅ Video playback support
- ✅ Zoom and pan for images
- ✅ Comprehensive keyboard shortcuts
- ✅ AppImage distribution for Linux
- ✅ Cross-platform compatibility
