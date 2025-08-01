# Photo Selector

A simple and elegant desktop application for browsing, selecting, and organizing your photo collection. Built with Electron and TypeScript.

![Photo Selector](https://img.shields.io/badge/electron-37.x-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.x-blue) ![License](https://img.shields.io/badge/license-ISC-green)

## Features

- 🖼️ **Photo Browsing**: Browse photos from any folder on your computer
- 🎨 **Modern UI**: Clean, modern interface with glassmorphism design
- ⚡ **Fast Performance**: Built on Electron for native desktop performance
- 🔒 **Secure**: Implements Electron security best practices
- 📱 **Responsive**: Adapts to different window sizes

## Screenshots

The application features a beautiful welcome screen and an intuitive photo grid view for browsing your images.

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

## Security

This application follows Electron security best practices:
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Secure IPC communication via preload script
- ✅ Content Security Policy implemented

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
