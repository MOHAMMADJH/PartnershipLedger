const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Cleaning app cache...');

// Clean various caches
try {
  execSync('expo doctor --fix-dependencies', { stdio: 'inherit' });
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  // Clear node_modules and reinstall
  if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('Removing node_modules...');
    // Use appropriate command based on OS
    try {
      execSync(process.platform === 'win32' ? 'rmdir /s /q node_modules' : 'rm -rf node_modules', { stdio: 'inherit' });
    } catch (e) {
      console.warn('Error removing node_modules, may need manual deletion');
    }
  }
  
  console.log('Reinstalling dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Cleaning Expo cache...');
  execSync('expo start --clear', { stdio: 'inherit' });
  
  console.log('Done! Try running your app now.');
} catch (error) {
  console.error('Error during cleanup:', error);
}
