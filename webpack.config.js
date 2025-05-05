const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add polyfills
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process/browser"),
    "url": require.resolve("url/"),
  };

  // Add aliases for problematic modules
  config.resolve.alias = {
    ...config.resolve.alias,
    "stream": require.resolve("stream-browserify"),
    "url": require.resolve("url/"),
    "@supabase/realtime-js/node_modules/ws/lib/stream.js": require.resolve("stream-browserify"),
    "@supabase/realtime-js/node_modules/ws/lib/websocket.js": require.resolve("url/"),
  };

  // Add _interopRequireDefault polyfill and other globals
  config.plugins.push(
    new webpack.ProvidePlugin({
      _interopRequireDefault: [path.resolve(__dirname, 'src/interopPolyfill.js'), 'default'],
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
      stream: ['stream-browserify', 'default'],
    })
  );

  // Add plugin to inject process and buffer
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  // Add plugin to define global variables
  config.plugins.push(
    new webpack.DefinePlugin({
      'global.STREAM_BROWSERIFY': JSON.stringify(true),
    })
  );

  return config;
};
