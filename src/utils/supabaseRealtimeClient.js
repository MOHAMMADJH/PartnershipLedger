/**
 * Custom implementation of the Supabase Realtime client for React Native
 * This implementation avoids using the Node.js modules that are not available in React Native
 */

// Create a mock implementation of the Supabase Realtime client
class MockRealtimeClient {
  constructor(options = {}) {
    this.channels = [];
    this.options = options;
    this.isConnected = false;
    this.listeners = {
      open: [],
      close: [],
      error: [],
      message: [],
    };
  }

  // Connect to the Supabase Realtime server
  connect() {
    console.log('Mock Realtime client connected');
    this.isConnected = true;
    this._triggerEvent('open');
    return this;
  }

  // Disconnect from the Supabase Realtime server
  disconnect() {
    console.log('Mock Realtime client disconnected');
    this.isConnected = false;
    this._triggerEvent('close');
    return this;
  }

  // Create a new channel
  channel(topic, params = {}) {
    const channel = new MockRealtimeChannel(topic, params, this);
    this.channels.push(channel);
    return channel;
  }

  // Remove a channel
  removeChannel(channel) {
    this.channels = this.channels.filter(c => c !== channel);
    return this;
  }

  // Add an event listener
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }

  // Remove an event listener
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }

  // Trigger an event
  _triggerEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        callback(data);
      });
    }
  }
}

// Create a mock implementation of the Supabase Realtime channel
class MockRealtimeChannel {
  constructor(topic, params, socket) {
    this.topic = topic;
    this.params = params;
    this.socket = socket;
    this.bindings = {};
    this.state = 'closed';
  }

  // Subscribe to the channel
  subscribe(callback) {
    console.log(`Mock Realtime channel subscribed to ${this.topic}`);
    this.state = 'joined';
    if (callback) callback();
    this._trigger('subscription', { event: 'SUBSCRIBED', topic: this.topic });
    return this;
  }

  // Unsubscribe from the channel
  unsubscribe(callback) {
    console.log(`Mock Realtime channel unsubscribed from ${this.topic}`);
    this.state = 'closed';
    if (callback) callback();
    this._trigger('subscription', { event: 'UNSUBSCRIBED', topic: this.topic });
    return this;
  }

  // Add an event listener
  on(event, callback) {
    this.bindings[event] = this.bindings[event] || [];
    this.bindings[event].push(callback);
    return this;
  }

  // Remove an event listener
  off(event, callback) {
    if (!this.bindings[event]) return this;
    this.bindings[event] = this.bindings[event].filter(cb => cb !== callback);
    return this;
  }

  // Trigger an event
  _trigger(event, data) {
    if (this.bindings[event]) {
      this.bindings[event].forEach(callback => {
        callback(data);
      });
    }
  }
}

// Export the mock implementation
export { MockRealtimeClient as RealtimeClient };
