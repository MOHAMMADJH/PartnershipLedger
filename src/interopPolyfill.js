/**
 * Polyfill for _interopRequireDefault function used by React Native Web
 * This function is used to handle ES modules compatibility
 */
export default function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Apply the polyfill globally
if (typeof window !== 'undefined') {
  window._interopRequireDefault = _interopRequireDefault;
}

// Ensure stream is available
if (typeof window !== 'undefined' && !window.stream) {
  try {
    const streamBrowserify = require('stream-browserify');
    window.stream = streamBrowserify;

    // Patch the require function to handle 'stream' module
    const originalRequire = window.require || require;
    const patchedRequire = function(moduleName) {
      if (moduleName === 'stream') {
        return streamBrowserify;
      }
      return originalRequire(moduleName);
    };

    // Override the require function
    if (window.require) {
      window.require = patchedRequire;
    }
  } catch (error) {
    console.error('Failed to load stream polyfill:', error);
  }
}
