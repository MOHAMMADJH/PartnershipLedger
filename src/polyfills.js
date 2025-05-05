// Polyfills for React Native and Web
import { Platform } from 'react-native';

// Define _interopRequireDefault globally for web
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  // Add the missing _interopRequireDefault function
  window._interopRequireDefault = function(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  };

  // Make it available globally
  global._interopRequireDefault = window._interopRequireDefault;
}

// For all platforms
try {
  // Ensure Buffer is available
  global.Buffer = global.Buffer || require('buffer').Buffer;

  // Ensure process is available
  global.process = global.process || require('process');

  // Ensure stream is available
  if (!global.stream) {
    const streamBrowserify = require('stream-browserify');
    global.stream = streamBrowserify;

    // Patch the require function to handle 'stream' module
    const originalRequire = global.require || require;
    const patchedRequire = function(moduleName) {
      if (moduleName === 'stream') {
        return streamBrowserify;
      }
      return originalRequire(moduleName);
    };

    // Override the require function
    if (global.require) {
      global.require = patchedRequire;
    }
  }
} catch (error) {
  console.error('Failed to load polyfills:', error);
}

// For React Native specific polyfills
if (Platform.OS !== 'web') {
  try {
    // Additional polyfills for React Native
    const { polyfillGlobal } = require('react-native/Libraries/Utilities/PolyfillFunctions');
    const streamBrowserify = require('stream-browserify');

    // Polyfill for the 'stream' module
    polyfillGlobal('stream', () => streamBrowserify);
  } catch (error) {
    console.error('Failed to load React Native specific polyfills:', error);
  }
}

// For Web, additional polyfills are handled by webpack.config.js
