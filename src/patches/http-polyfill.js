// Mock implementation of the Node.js http module
module.exports = {
  createServer: function() {
    return {
      listen: function() {
        return this;
      },
      on: function() {
        return this;
      },
      close: function() {
        return this;
      }
    };
  }
};
