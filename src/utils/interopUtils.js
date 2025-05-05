/**
 * Utility functions for module interoperability
 * This file re-exports the central helper from interopRequire.js
 */

// Import the central definition
const _interopRequireDefault = require('./interopRequire');

// Export the main function as default and named export
module.exports = _interopRequireDefault;
module.exports.default = _interopRequireDefault;
module.exports._interopRequireDefault = _interopRequireDefault;
