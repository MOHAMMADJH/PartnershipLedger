// This file is used to patch the Supabase Realtime JS package
// to work with React Native by providing a custom implementation of the WebSocket module

// Import the required modules
const Stream = require('stream-browserify');
const Buffer = require('buffer').Buffer;
const process = require('process');

// Export the modules
module.exports = {
  Stream,
  Buffer,
  process,
};
