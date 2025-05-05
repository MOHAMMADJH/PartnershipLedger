/**
 * Central definition of interop helpers
 * This file is the ONLY place where these functions should be defined
 */

'use strict';

// Create a marker to prevent duplicate definitions
const INTEROP_DEFINED = typeof global !== 'undefined' && global.__INTEROP_DEFINED__;

// Define the central _interopRequireDefault function
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}



// Export the main function as default and CommonJS
module.exports = _interopRequireDefault;
module.exports.default = _interopRequireDefault;

// Export the main function also as a named export for consistency
module.exports._interopRequireDefault = _interopRequireDefault;
