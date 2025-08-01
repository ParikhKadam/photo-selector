#!/bin/bash

# Photo Selector Build Script for AppImage Distribution

echo "🏗️  Building Photo Selector AppImage..."
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

# Create AppImage
echo "📦 Creating AppImage..."
npm run dist:appimage

# Check if AppImage creation was successful
if [ $? -ne 0 ]; then
    echo "❌ AppImage creation failed!"
    exit 1
fi

# Show results
echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📁 AppImage location:"
ls -lh release/*.AppImage

echo ""
echo "🚀 To run the AppImage:"
echo "   chmod +x \"release/Photo Selector-1.0.0.AppImage\""
echo "   ./\"release/Photo Selector-1.0.0.AppImage\""
echo ""
echo "📋 File ready for distribution!"
