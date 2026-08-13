// JSDom does not include a full implementation of webcrypto
global.crypto.subtle = require('crypto').webcrypto.subtle;

// JSDom does not implement Blob URLs
global.URL.createObjectURL = () => '';
global.URL.revokeObjectURL = () => {};

// JSDom's `performance` has no User Timing (mark/measure) support. It's a getter-only
// property on `window`, so it must be redefined rather than assigned.
Object.defineProperty(global, 'performance', {
    value: require('perf_hooks').performance,
    configurable: true,
    writable: true,
});
