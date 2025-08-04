# Photo Selector - TODO List

## 🚀 Progressive Loading Optimization for Image Viewer

### Current Issue
Image viewer sometimes slow with very large images (4K+, 10MB+)

### Solution
Implement progressive loading with medium-quality previews

### Expected Benefits
- **5-10x faster** perceived loading for large images
- **Better user experience** with instant previews
- **Full quality** still available for zoom/pan
- **Storage overhead**: ~50KB per image (vs current 5KB)

---

## 📋 Implementation Checklist

### 1. Thumbnail Service Enhancements
- [ ] Add `getMediumThumbnail(filePath: string)` method to ThumbnailService
- [ ] Generate 800px thumbnails alongside existing 200px thumbnails
- [ ] Update cache directory structure: `thumbnails/small/`, `thumbnails/medium/`
- [ ] Add cleanup for medium thumbnails in `cleanupCache()`
- [ ] Handle different aspect ratios for medium thumbnails

### 2. New IPC Handlers
- [ ] Add `'image:getProgressivePreview'` handler in main.ts
- [ ] Return both medium preview path and full resolution path
- [ ] Update preload.ts to expose `getProgressivePreview` API
- [ ] Add TypeScript interface for progressive preview response
- [ ] Implement error handling for missing medium thumbnails

### 3. Renderer Changes
- [ ] Update image viewer to load medium preview first
- [ ] Implement background loading of full resolution
- [ ] Add smooth transition from preview to full quality
- [ ] Ensure zoom/pan works with full resolution once loaded
- [ ] Add loading states and visual feedback

### 4. Storage Considerations
- [ ] Monitor thumbnail cache size (expect ~10x increase)
- [ ] Consider implementing cache size limits (e.g., max 500MB)
- [ ] Add cache statistics to help users manage storage
- [ ] Implement cache cleanup strategies (LRU, age-based)
- [ ] Add cache health checks and corruption recovery

### 5. User Experience Improvements
- [ ] Add loading indicator during full resolution load
- [ ] Show quality indicator (preview vs full quality)
- [ ] Allow users to disable progressive loading in settings
- [ ] Add smooth loading animations/transitions
- [ ] Implement preloading for next/previous images

### 6. Performance Testing
- [ ] Test with 4K images (20MB+) on different storage types (SSD, HDD)
- [ ] Measure loading time improvements
- [ ] Test memory usage with multiple large images
- [ ] Benchmark thumbnail generation performance
- [ ] Test with various image formats (JPEG, PNG, TIFF, etc.)

### 7. Configuration Options
- [ ] Add setting for medium thumbnail size (600px, 800px, 1200px)
- [ ] Add setting for progressive loading on/off
- [ ] Add setting for cache size limits
- [ ] Add setting for cache cleanup frequency
- [ ] Add developer mode with cache statistics

---

## 📊 Technical Specifications

### Thumbnail Sizes
- **Small**: 200x200px (current) - for grid view
- **Medium**: 800x800px (new) - for instant preview
- **Full**: Original resolution - for zoom/pan

### Cache Structure
```
~/.config/Photo Selector/thumbnails/
├── small/          # 200px thumbnails (existing)
├── medium/         # 800px thumbnails (new)
└── cache.json      # Cache metadata and statistics
```

### API Extensions
```typescript
interface ProgressivePreviewResult {
  success: boolean;
  filePath: string;           // Full resolution path
  previewPath?: string;       // Medium quality preview path
  thumbnailPath?: string;     // Small thumbnail path
  exists: boolean;
  error?: string;
}
```

---

## ⏱️ Effort Estimation

- **Total Time**: 4-6 hours
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Current thumbnail system (✅ Complete)

---

## 🔄 Future Enhancements

### Phase 2 Improvements
- [ ] Smart preloading based on user behavior
- [ ] Adaptive quality based on network/storage speed
- [ ] Background thumbnail generation for entire folders
- [ ] Integration with OS thumbnail systems (Linux only)
- [ ] WebP format support for better compression

### Phase 3 Advanced Features
- [ ] Machine learning for predicting which images user will view
- [ ] Cloud storage optimization for remote files
- [ ] Multi-threaded thumbnail generation
- [ ] Advanced caching strategies (predictive, contextual)

---

## 📝 Notes

- This optimization focuses on **perceived performance** rather than actual loading speed
- The current thumbnail system provides a solid foundation for this enhancement
- Progressive loading is widely used in modern image applications (Google Photos, etc.)
- Storage overhead is acceptable given modern storage capacities
