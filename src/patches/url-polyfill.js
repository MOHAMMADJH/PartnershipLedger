// Mock implementation of the Node.js url module
module.exports = {
  parse: function(urlString) {
    try {
      const url = new URL(urlString);
      return {
        protocol: url.protocol,
        slashes: true,
        auth: url.username ? (url.password ? `${url.username}:${url.password}` : url.username) : null,
        host: url.host,
        port: url.port,
        hostname: url.hostname,
        hash: url.hash,
        search: url.search,
        query: url.search.substring(1),
        pathname: url.pathname,
        path: url.pathname + url.search,
        href: url.href
      };
    } catch (e) {
      return {};
    }
  },
  
  resolve: function(from, to) {
    try {
      return new URL(to, from).href;
    } catch (e) {
      return to;
    }
  },
  
  format: function(urlObj) {
    try {
      if (typeof urlObj === 'string') return urlObj;
      
      let result = '';
      if (urlObj.protocol) result += urlObj.protocol + '//';
      if (urlObj.auth) result += urlObj.auth + '@';
      if (urlObj.host) {
        result += urlObj.host;
      } else if (urlObj.hostname) {
        result += urlObj.hostname;
        if (urlObj.port) result += ':' + urlObj.port;
      }
      if (urlObj.pathname) result += urlObj.pathname;
      if (urlObj.search) result += urlObj.search;
      else if (urlObj.query) result += '?' + urlObj.query;
      if (urlObj.hash) result += urlObj.hash;
      
      return result;
    } catch (e) {
      return '';
    }
  }
};
