import { logger } from '@protontech/logger';

import { setPanicHook } from '@proton/andromeda';

/**
 * Andromeda ships `console_error_panic_hook` and exposes no panic callback, so a Rust panic only prints to
 * `console.error`. When it happens inside an async call, the returned promise never settles: the caller hangs
 * without any error. Intercepting the hook output is the only way to get the panic into the persisted logs.
 */
const PANIC_PREFIX = 'panicked at';

let installed = false;

export const installWasmPanicCapture = () => {
    if (installed) {
        return;
    }
    installed = true;
    setPanicHook();

    // Patching console.error is the point here: it is the only output of the panic hook
    // eslint-disable-next-line no-console
    const originalConsoleError = console.error.bind(console);
    // eslint-disable-next-line no-console
    console.error = (...args: unknown[]) => {
        const [first] = args;
        if (typeof first === 'string' && first.startsWith(PANIC_PREFIX)) {
            // The hook formats as "panicked at <file>:<line>:<col>:\n<message>\n\nStack:\n...", only the first
            // two lines are useful, the rest is the wasm-bindgen JS shim.
            logger.error(`Andromeda WASM panic: ${first.split('\n').slice(0, 2).join(' ')}`);
        }
        originalConsoleError(...args);
    };
};
