// Mock implementation of the Node.js crypto module
module.exports = {
  randomBytes: function(size) {
    const result = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      result[i] = Math.floor(Math.random() * 256);
    }
    return result;
  },
  createHash: function(algorithm) {
    return {
      update: function(data) {
        return this;
      },
      digest: function(encoding) {
        // Return a mock hash
        return 'mock-hash';
      }
    };
  },
  createHmac: function(algorithm, key) {
    return {
      update: function(data) {
        return this;
      },
      digest: function(encoding) {
        // Return a mock hmac
        return 'mock-hmac';
      }
    };
  }
};
