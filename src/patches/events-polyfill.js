// Mock implementation of the Node.js events module
class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.removeListener(event, onceWrapper);
    };
    this.on(event, onceWrapper);
    return this;
  }

  off(event, listener) {
    return this.removeListener(event, listener);
  }

  removeListener(event, listener) {
    if (this._events[event]) {
      const idx = this._events[event].indexOf(listener);
      if (idx !== -1) {
        this._events[event].splice(idx, 1);
      }
    }
    return this;
  }

  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }

  emit(event, ...args) {
    if (this._events[event]) {
      this._events[event].forEach(listener => {
        listener(...args);
      });
      return true;
    }
    return false;
  }

  listenerCount(event) {
    return this._events[event] ? this._events[event].length : 0;
  }

  listeners(event) {
    return this._events[event] ? [...this._events[event]] : [];
  }
}

// Export the EventEmitter class
module.exports = {
  EventEmitter,
  // Add any other exports from the events module that might be needed
};
