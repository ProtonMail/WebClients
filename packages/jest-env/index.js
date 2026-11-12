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
        // For ./setLocation.js: tests cannot reach the JSDOM instance otherwise.
        this.global.jsdom = this.dom;

        // jsdom hides a <dialog> without `open`, as browsers do, and nothing in it can take focus.
        // Our modals render one and show it with the `dialog { display: block }` of our CSS reset,
        // which tests do not load.
        const style = this.global.document.createElement('style');
        style.textContent = 'dialog { display: block; }';
        this.global.document.head.append(style);

        // jsdom has `style.WebkitAnimation` but no AnimationEvent. React then listens for
        // `webkitAnimationEnd` and misses the `animationend` that tests fire.
        const { Event } = this.global;
        this.global.AnimationEvent ??= class AnimationEvent extends Event {
            constructor(type, { animationName = '', elapsedTime = 0, pseudoElement = '', ...init } = {}) {
                super(type, init);
                Object.assign(this, { animationName, elapsedTime, pseudoElement });
            }
        };
    }

    async setup() {} // eslint-disable-line

    // Closing the jsdom window clears its pending timers. Left open, one long timer keeps a
    // --runInBand jest process alive after the last test, and each file's DOM stays in memory.
    async teardown() {
        await super.teardown();
    }
}

module.exports = MyEnvironment;
