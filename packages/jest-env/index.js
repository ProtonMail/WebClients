// Stolen from: https://github.com/ipfs/jest-environment-aegir/blob/master/src/index.js
// Overcomes error from jest internals.. this thing: https://github.com/facebook/jest/issues/6248
// Mostly needed for making OpenPGP.js works

const JSDOMEnvironment = require('jest-environment-jsdom').default;

class MyEnvironment extends JSDOMEnvironment {
    constructor({ globalConfig, projectConfig }, context) {
        super(
            {
                globalConfig,
                projectConfig: {
                    ...projectConfig,
                    globals: {
                        ...projectConfig.globals,
                        Uint32Array,
                        Uint8Array,
                        ArrayBuffer,
                        TextDecoder,
                        TextEncoder,
                        ReadableStream,
                        WritableStream,
                        Response,
                        Request,
                        BroadcastChannel,
                        TransformStream,
                        fetch,
                        Headers,
                        FormData,
                        structuredClone,
                        // Optionally global AbortController and AbortSignal since it breaks jsdom dom event listeners which use AbortSignals (docs-editor and drive)
                        ...(projectConfig.testEnvironmentOptions?.abortSignal ? { AbortController, AbortSignal } : {}),
                    },
                },
            },
            context
        );
    }

    async setup() {} // eslint-disable-line

    async teardown() {} // eslint-disable-line
}

module.exports = MyEnvironment;
