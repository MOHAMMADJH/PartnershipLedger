// Patch the require function to handle problematic modules
const originalRequire = global.require || require;
const moduleResolver = require('./src/moduleResolver');

global.require = function(moduleName) {
  if (moduleName === 'stream' && moduleResolver.stream) {
    return moduleResolver.stream;
  }
  return originalRequire(moduleName);
};

// Import polyfills first
import './src/polyfills';

// Import the app
import { registerRootComponent } from 'expo';
import App from './App';

// Register the app
registerRootComponent(App);
