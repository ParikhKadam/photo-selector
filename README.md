# Photo Selector

A simple and elegant desktop application for browsing, selecting, and organizing your photo collection. Built with Electron and TypeScript.

![Photo Selector](https://img.shields.io/badge/electron-37.x-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.x-blue) ![License](https://img.shields.io/badge/license-ISC-green)

## Features

- 🖼️ **Photo Browsing**: Browse photos from any folder on your computer
- 🔍 **High-Quality Preview**: Double-click images for full-resolution preview with fullscreen mode
- ⭐ **Star/Shortlist Photos**: Mark your favorite photos with star ratings for easy access
- 🔽 **Smart Filtering**: Filter to show only starred photos in any folder
- 📤 **Export Starred Photos**: Copy all your starred photos to any destination folder
- 🎨 **Modern UI**: Clean, modern interface with glassmorphism design
- ⚡ **Fast Performance**: Built on Electron for native desktop performance
- 🧭 **Image Navigation**: Navigate through images using arrow keys, mouse wheel, or navigation buttons
- 🔒 **Secure**: Implements Electron security best practices
- 📱 **Responsive**: Adapts to different window sizes
- 💾 **Persistent Storage**: Stars are saved in a local SQLite database

## Screenshots

The application features a beautiful welcome screen and an intuitive photo grid view for browsing your images.

## Usage

### Basic Operations
- **Open Folder**: Use Ctrl+O or File menu to select a photo folder
- **View Thumbnails**: All images and videos in the folder will be displayed as thumbnails
- **Select Images**: Click any thumbnail to select it
- **Preview Images**: Double-click any image thumbnail to open full-resolution preview
- **Star Photos**: Click the star button (★) on any photo to add it to your favorites
- **Filter Photos**: Use the "Show Starred Only" button in the toolbar to filter to starred photos
- **Export Starred**: Use the "Export Starred" button to copy all starred photos to a folder
- **View Starred Photos**: Use Ctrl+Shift+S or File menu to view all starred photos

### Star/Shortlist Features
- **Grid View Starring**: Hover over any photo to see the star button, click to star/unstar
- **Preview Starring**: In image preview mode, use the Star button or press 'S' key
- **Smart Filtering**: Use the "Show Starred Only" button to filter current folder to starred photos
- **Starred Collection**: Access all your starred photos via the File menu or Ctrl+Shift+S
- **Export Functionality**: Copy all starred photos to any folder with the "Export Starred" button
- **Persistent Storage**: Starred photos are saved to a local database in your home directory
- **Cross-Platform**: Database location adapts to your operating system (Windows/Mac/Linux)

### Export Features
- **One-Click Export**: Export all starred photos with a single button click
- **Smart Naming**: Automatically handles duplicate filenames by appending numbers
- **Progress Feedback**: Visual feedback during export process
- **Error Handling**: Detailed reporting of successful and failed exports
- **Folder Selection**: Choose any destination folder for your exported photos

### Image Preview Navigation
- **Mouse Navigation**: 
  - Use navigation buttons (← →) on sides of preview
  - Mouse wheel to scroll through images
- **Keyboard Shortcuts**:
  - `←` / `→` Arrow keys to navigate between images
  - `F` key to toggle fullscreen mode
  - `S` key to star/unstar current image
  - `ESC` key to close preview
  - `Ctrl+O` to open folder
  - `Ctrl+Shift+S` to view starred photos
- **Image Counter**: Shows current position (e.g., "3 of 12 images")

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)

### Setup
1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building the Application
```bash
npm run build
```

### Running the Built Application
```bash
npm start
```

## Building for Distribution

### Create Application Package
```bash
npm run pack
```

### Create Installer/Executable
```bash
npm run dist
```

## Project Structure

```
photo-selector/
├── src/
│   ├── main.ts          # Main Electron process
│   └── preload.ts       # Preload script for secure IPC
├── renderer/
│   ├── index.html       # Main UI
│   ├── styles.css       # Styling
│   └── renderer.js      # Renderer process logic
├── dist/                # Compiled TypeScript output
├── package.json         # Project configuration
└── tsconfig.json        # TypeScript configuration
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

The application stores starred photo information in a SQLite database located at:
- **Linux/Mac**: `~/.photo-selector/photo-selector.db`
- **Windows**: `%USERPROFILE%\.photo-selector\photo-selector.db`

The database automatically:
- Creates the necessary directory structure on first run
- Stores photo metadata (path, name, size, type, star date)
- Maintains data persistence across application restarts
- Handles cleanup of non-existent files when accessing starred photos

## Security

This application follows Electron security best practices:
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Secure IPC communication via preload script
- ✅ Content Security Policy implemented
- ✅ Local SQLite database with no network access

## Development Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run in development mode
- `npm start` - Run production build
- `npm run clean` - Clean build directory
- `npm run pack` - Package for current platform
- `npm run dist` - Create distribution files

## Technologies Used

- **Electron**: Cross-platform desktop app framework
- **TypeScript**: Type-safe JavaScript development
- **SQLite**: Local database for storing starred photos
- **Node.js**: Backend runtime for main process
- **HTML5/CSS3**: Modern web standards for UI
- **Electron Builder**: Application packaging and distribution

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions, please create an issue in the project repository.
