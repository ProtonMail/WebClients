// Stolen from: https://github.com/ipfs/jest-environment-aegir/blob/master/src/index.js
// Overcomes error from jest internals.. this thing: https://github.com/facebook/jest/issues/6248
// Mostly needed for making OpenPGP.js works

const JSDOMEnvironment = require('jest-environment-jsdom');

class MyEnvironment extends JSDOMEnvironment {
    constructor(config) {
        super({ ...config, globals: { ...config.globals, Uint32Array, Uint8Array, ArrayBuffer } });
    }

    async setup() {} // eslint-disable-line

    async teardown() {} // eslint-disable-line
}

module.exports = MyEnvironment;
