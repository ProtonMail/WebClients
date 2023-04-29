// JSDom does not include a full implementation of webcrypto
const crypto = require('crypto').webcrypto;
global.crypto.subtle = crypto.subtle;
