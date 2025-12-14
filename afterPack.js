/**
 * afterPack hook for electron-builder
 * Ensures Sharp native dependencies are properly handled
 */

const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const platform = context.electronPlatformName;
  const appOutDir = context.appOutDir;

  console.log(`\n📦 Running afterPack for platform: ${platform}`);
  console.log(`📂 App output directory: ${appOutDir}\n`);

  // For Linux AppImage, verify Sharp binaries are properly unpacked
  if (platform === 'linux') {
    const resourcesDir = path.join(appOutDir, 'resources');
    const unpackedDir = path.join(resourcesDir, 'app.asar.unpacked');

    // Check if Sharp is unpacked
    const sharpUnpacked = path.join(unpackedDir, 'node_modules', 'sharp');
    if (fs.existsSync(sharpUnpacked)) {
      console.log('✅ Sharp module is properly unpacked from ASAR');

      // Check for @img packages
      const imgDir = path.join(unpackedDir, 'node_modules', '@img');
      if (fs.existsSync(imgDir)) {
        console.log('✅ @img platform packages are properly unpacked');
      } else {
        console.log('ℹ️  @img packages not found (may be using older Sharp version)');
      }
    } else {
      console.warn('⚠️  Sharp module not found in unpacked resources');
    }
  }

  console.log('✅ afterPack completed\n');
};
