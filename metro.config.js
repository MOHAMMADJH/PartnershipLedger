// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const path = require('path');

/** @type {import('@expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

// Add additional configurations for react-native-reanimated
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'mjs',
];

// Add extraNodeModules for polyfills
defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  stream: path.resolve(__dirname, 'src/patches/stream-polyfill.js'),
  buffer: require.resolve('buffer'),
  process: require.resolve('process/browser'),
  events: path.resolve(__dirname, 'src/patches/events-polyfill.js'),
  http: path.resolve(__dirname, 'src/patches/http-polyfill.js'),
  https: path.resolve(__dirname, 'src/patches/http-polyfill.js'),
  net: path.resolve(__dirname, 'src/patches/http-polyfill.js'),
  tls: path.resolve(__dirname, 'src/patches/http-polyfill.js'),
  zlib: path.resolve(__dirname, 'src/patches/http-polyfill.js'),
  crypto: path.resolve(__dirname, 'src/patches/crypto-polyfill.js'),
  url: path.resolve(__dirname, 'src/patches/url-polyfill.js'),
};

// Add specific module resolution for problematic modules
defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle Node.js core modules
  if (moduleName === 'stream') {
    return {
      filePath: path.resolve(__dirname, 'src/patches/stream-polyfill.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'events') {
    return {
      filePath: path.resolve(__dirname, 'src/patches/events-polyfill.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'crypto') {
    return {
      filePath: path.resolve(__dirname, 'src/patches/crypto-polyfill.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'url') {
    return {
      filePath: path.resolve(__dirname, 'src/patches/url-polyfill.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'http' || moduleName === 'https' || moduleName === 'net' ||
      moduleName === 'tls' || moduleName === 'zlib') {
    return {
      filePath: path.resolve(__dirname, 'src/patches/http-polyfill.js'),
      type: 'sourceFile',
    };
  }

  // Handle specific paths that are known to cause issues
  if (context.originModulePath.includes('@supabase/realtime-js/node_modules/ws/lib')) {
    if (moduleName === 'stream') {
      return {
        filePath: path.resolve(__dirname, 'src/patches/stream-polyfill.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'events') {
      return {
        filePath: path.resolve(__dirname, 'src/patches/events-polyfill.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'crypto') {
      return {
        filePath: path.resolve(__dirname, 'src/patches/crypto-polyfill.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'url') {
      return {
        filePath: path.resolve(__dirname, 'src/patches/url-polyfill.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'http' || moduleName === 'https' || moduleName === 'net' ||
        moduleName === 'tls' || moduleName === 'zlib') {
      return {
        filePath: path.resolve(__dirname, 'src/patches/http-polyfill.js'),
        type: 'sourceFile',
      };
    }
  }

  // Let Metro handle other modules normally
  return context.resolveRequest(context, moduleName, platform);
};

// Configure the transformer to handle polyfills
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

module.exports = wrapWithReanimatedMetroConfig(defaultConfig);
