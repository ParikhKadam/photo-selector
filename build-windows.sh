#!/bin/bash

# Photo Selector Build Script for Windows Distribution

echo "🏗️  Building Photo Selector Windows Executables..."
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Build TypeScript
echo "🔨 Compiling TypeScript..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed!"
    exit 1
fi

# Create Windows executables
echo "📦 Creating Windows executables..."
echo "   - Creating NSIS installer (.exe)"
echo "   - Creating portable executable (.exe)"
npm run dist:win

# Check if Windows build was successful
if [ $? -ne 0 ]; then
    echo "❌ Windows build failed!"
    exit 1
fi

# Show results
echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📁 Windows executables location:"
find release -name "*.exe" -exec ls -lh {} \;

echo ""
echo "🚀 Windows distribution files:"
echo "   📦 Installer: Photo Selector Setup 1.0.0.exe (NSIS installer)"
echo "   🚀 Portable: Photo Selector 1.0.0.exe (Portable executable)"
echo ""
echo "📋 Files ready for Windows distribution!"
