const getRandomValues = (buf) => {
  if (typeof process !== 'undefined') {
    const nodeCrypto = require('crypto');
    const bytes = nodeCrypto.randomBytes(buf.length);
    buf.set(bytes);
    return buf;
  }

  if (typeof crypto !== 'undefined') {
    return crypto.getRandomValues(buf);
  }

  throw new Error('No secure random number generator available.');
};

module.exports = getRandomValues;
