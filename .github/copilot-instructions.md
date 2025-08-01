<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Photo Selector - Copilot Instructions

This is an Electron desktop application built with TypeScript for selecting and organizing photos.

## Project Structure
- `src/main.ts` - Main Electron process (Node.js environment)
- `src/preload.ts` - Preload script for secure communication between main and renderer
- `renderer/` - Renderer process files (HTML, CSS, JS)
- `dist/` - Compiled TypeScript output

## Key Technologies
- **Electron**: Desktop app framework
- **TypeScript**: Type-safe JavaScript
- **Node.js**: Backend runtime for main process
- **HTML/CSS/JavaScript**: Frontend for renderer process

## Security Model
- Context isolation is enabled
- Node integration is disabled in renderer
- IPC communication via preload script
- Use contextBridge for secure API exposure

## Development Guidelines
- Follow TypeScript best practices
- Use modern ES6+ features
- Implement proper error handling
- Maintain separation between main and renderer processes
- Use Electron's security best practices

## File Operations
- Use Node.js fs module in main process only
- Communicate file operations via IPC
- Handle file paths properly across platforms

## Common Patterns
- Use `ipcRenderer.invoke()` for async main process calls
- Use `ipcMain.handle()` for handling async requests
- Implement proper cleanup for event listeners
- Use `app.whenReady()` for initialization
