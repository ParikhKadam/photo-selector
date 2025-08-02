# Cross-Platform Build Setup

## GitHub Actions Workflow Created! 🎉

### What's Included:
- **Linux**: AppImage (Ubuntu runner)
- **Windows**: NSIS Installer + Portable EXE (Windows runner)  
- **macOS**: DMG with universal binaries (macOS runner)

### Build Matrix:
- All three platforms build simultaneously
- Automatic release creation on git tags
- Professional asset naming and organization

### Triggers:
1. **Automatic**: Push any tag starting with `v` (e.g., `v1.1.0`)
2. **Manual**: Workflow dispatch from GitHub Actions tab

### Icons Status:
- ✅ Linux: `build/icon.svg` (ready)
- ✅ Windows: `build/icon.ico` (ready)
- ⚠️ macOS: Using SVG (should create `build/icon.icns` for better macOS integration)

### Next Steps:
1. Commit and push this workflow
2. Create a git tag to trigger the build
3. Watch GitHub Actions build all platforms automatically!

### Usage:
```bash
# To trigger a release build:
git tag v1.2.0
git push origin v1.2.0

# The workflow will:
# 1. Build for Linux, Windows, macOS
# 2. Create GitHub release
# 3. Upload all binaries automatically
```

### Asset Names (will be created):
- `Photo.Selector-v1.1.0-linux-x64.AppImage`
- `Photo.Selector-v1.1.0-windows-x64-setup.exe`
- `Photo.Selector-v1.1.0-windows-x64-portable.exe`
- `Photo.Selector-v1.1.0-macos-x64.dmg`

Ready to build for all platforms! 🚀
