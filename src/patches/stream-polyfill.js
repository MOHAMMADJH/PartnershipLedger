// Custom implementation of the stream module for React Native
const EventEmitter = require('./events-polyfill').EventEmitter;

// Basic implementation of a Readable stream
class Readable extends EventEmitter {
  constructor(options) {
    super();
    this.readable = true;
    this.options = options || {};
    this._buffer = [];
    this._ended = false;
  }

  push(chunk) {
    if (chunk === null) {
      this._ended = true;
      this.emit('end');
      return false;
    }

    this._buffer.push(chunk);
    this.emit('data', chunk);
    return true;
  }

  read() {
    if (this._buffer.length === 0) {
      return null;
    }
    return this._buffer.shift();
  }

  pipe(destination) {
    this.on('data', (chunk) => {
      destination.write(chunk);
    });

    this.on('end', () => {
      destination.end();
    });

    return destination;
  }
}

// Basic implementation of a Writable stream
class Writable extends EventEmitter {
  constructor(options) {
    super();
    this.writable = true;
    this.options = options || {};
    this._ended = false;
  }

  write(chunk) {
    if (this._ended) {
      return false;
    }

    this.emit('data', chunk);
    return true;
  }

  end(chunk) {
    if (chunk) {
      this.write(chunk);
    }

    this._ended = true;
    this.emit('finish');
    return this;
  }
}

// Basic implementation of a Duplex stream
class Duplex extends EventEmitter {
  constructor(options) {
    super();
    this.readable = true;
    this.writable = true;
    this.options = options || {};
    this._buffer = [];
    this._ended = false;
  }

  push(chunk) {
    if (chunk === null) {
      this._ended = true;
      this.emit('end');
      return false;
    }

    this._buffer.push(chunk);
    this.emit('data', chunk);
    return true;
  }

  read() {
    if (this._buffer.length === 0) {
      return null;
    }
    return this._buffer.shift();
  }

  write(chunk) {
    if (this._ended) {
      return false;
    }

    this.emit('data', chunk);
    return true;
  }

  end(chunk) {
    if (chunk) {
      this.write(chunk);
    }

    this._ended = true;
    this.emit('finish');
    return this;
  }

  pipe(destination) {
    this.on('data', (chunk) => {
      destination.write(chunk);
    });

    this.on('end', () => {
      destination.end();
    });

    return destination;
  }
}

// Basic implementation of a Transform stream
class Transform extends Duplex {
  constructor(options) {
    super(options);
    this._transform = options && options._transform || function(chunk, encoding, callback) {
      callback(null, chunk);
    };
  }

  _write(chunk, encoding, callback) {
    this._transform(chunk, encoding, callback);
  }
}

// Export the stream classes
module.exports = {
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough: Transform, // Simple passthrough implementation

  // Add static methods
  pipeline: function(source, ...streams) {
    let current = source;
    for (const stream of streams) {
      current = current.pipe(stream);
    }
    return current;
  },

  finished: function(stream, callback) {
    stream.on('finish', () => callback(null));
    stream.on('error', (err) => callback(err));
  }
};
