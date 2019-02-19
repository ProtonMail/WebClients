const getRandomValues = (buf) => {
  if (typeof process !== 'undefined') {
    const nodeCrypto = require('crypto');
    const bytes = nodeCrypto.randomBytes(buf.length);
    buf.set(bytes);
    return buf;
  }

  if (window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(buf);
  }

  if (window.msCrypto && window.msCrypto.getRandomValues) {
    return window.msCrypto.getRandomValues(buf);
  }

  throw new Error('No secure random number generator available.');
};

module.exports = getRandomValues;
