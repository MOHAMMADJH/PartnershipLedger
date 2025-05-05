/**
 * Central definition for interop helper functions
 * This file is designed to be the ONLY source of _interopRequireDefault functions
 * It prevents duplicate declarations by using a global marker
 */

'use strict';

// Check if we've already defined these functions
const INTEROP_MARKER = '__INTEROP_FUNCTIONS_DEFINED__';
const alreadyDefined =
  (typeof global !== 'undefined' && global[INTEROP_MARKER]) ||
  (typeof window !== 'undefined' && window[INTEROP_MARKER]);

// Define the base interop function
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Only define these helpers once globally
if (!alreadyDefined) {
  // Mark as defined
  if (typeof global !== 'undefined') {
    global[INTEROP_MARKER] = true;

    // Clean up any existing definitions to avoid conflicts
    if (global._interopRequireDefault2) delete global._interopRequireDefault2;
    if (global._interopRequireDefault3) delete global._interopRequireDefault3;
    if (global._interopRequireDefault4) delete global._interopRequireDefault4;
    if (global._interopRequireDefault5) delete global._interopRequireDefault5;
  }

  if (typeof window !== 'undefined') {
    window[INTEROP_MARKER] = true;

    // Clean up any existing definitions to avoid conflicts
    if (window._interopRequireDefault2) delete window._interopRequireDefault2;
    if (window._interopRequireDefault3) delete window._interopRequireDefault3;
    if (window._interopRequireDefault4) delete window._interopRequireDefault4;
    if (window._interopRequireDefault5) delete window._interopRequireDefault5;
  }

  // List of all variations we need to define
  const functionNames = [
    '_interopRequireDefault',
    '_interopRequireDefault2',
    '_interopRequireDefault3',
    '_interopRequireDefault4',
    '_interopRequireDefault5'
  ];

  // Define globally
  if (typeof global !== 'undefined') {
    functionNames.forEach(name => {
      // Always use our definition to ensure consistency
      global[name] = _interopRequireDefault;
    });
  }

  // Define for window (for web)
  if (typeof window !== 'undefined' && window !== global) {
    functionNames.forEach(name => {
      // Always use our definition to ensure consistency
      window[name] = _interopRequireDefault;
    });
  }
}

// Export the function
module.exports = _interopRequireDefault;

// Also export as default for ES modules
module.exports.default = _interopRequireDefault;

// Export all variations
module.exports._interopRequireDefault = _interopRequireDefault;
module.exports._interopRequireDefault2 = _interopRequireDefault;
module.exports._interopRequireDefault3 = _interopRequireDefault;
module.exports._interopRequireDefault4 = _interopRequireDefault;
module.exports._interopRequireDefault5 = _interopRequireDefault;
