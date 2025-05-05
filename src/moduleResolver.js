// Custom module resolver for problematic modules
const streamBrowserify = require('stream-browserify');

// Export the stream module
module.exports = {
  stream: streamBrowserify,
};
