module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true
      }],

      ["@babel/plugin-transform-class-properties", { "loose": false }],
      ["@babel/plugin-transform-private-methods", { "loose": false }],
      ["@babel/plugin-transform-private-property-in-object", { "loose": false }],
      'react-native-reanimated/plugin',

      // Add this to ensure proper module resolution
      ["module-resolver", {
        "root": ["./src"],
        "extensions": [".js", ".jsx", ".ts", ".tsx"],
        "alias": {
          "stream": "./src/patches/stream-polyfill.js",
          "events": "./src/patches/events-polyfill.js",
          "crypto": "./src/patches/crypto-polyfill.js",
          "url": "./src/patches/url-polyfill.js",
          "http": "./src/patches/http-polyfill.js",
          "https": "./src/patches/http-polyfill.js",
          "net": "./src/patches/http-polyfill.js",
          "tls": "./src/patches/http-polyfill.js",
          "zlib": "./src/patches/http-polyfill.js",
          "buffer": "buffer",
          "process": "process/browser",
          "@supabase/realtime-js/node_modules/ws/lib/stream.js": "./src/patches/stream-polyfill.js",
          "@supabase/realtime-js/node_modules/ws/lib/websocket-server.js": "./src/patches/http-polyfill.js",
          "@supabase/realtime-js/node_modules/ws/lib/crypto.js": "./src/patches/crypto-polyfill.js",
          "@supabase/realtime-js/node_modules/ws/lib/websocket.js": "./src/patches/url-polyfill.js",
          "node_modules/stream-browserify/index.js": "./src/patches/stream-polyfill.js"
        }
      }]
    ]
  };
};