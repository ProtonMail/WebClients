// JSDom does not include a full implementation of webcrypto
global.crypto.subtle = require('crypto').webcrypto.subtle;
