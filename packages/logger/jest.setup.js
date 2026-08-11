// JSDom does not include a full implementation of webcrypto
global.crypto.subtle = require('crypto').webcrypto.subtle;

// JSDom does not implement Blob URLs
global.URL.createObjectURL = () => '';
global.URL.revokeObjectURL = () => {};
