import { setPanicHook } from '@proton/proton-foundation-search';

import { Logger } from '../../shared/Logger';

/**
 * Capture of Rust panic text coming out of the search library WASM.
 *
 * The module is built `panic=abort`, so a Rust panic traps out of the WASM call and reaches JS as a
 * bare `WebAssembly.RuntimeError: unreachable` - no message, no location. `setPanicHook()` makes the
 * library print the real panic to `console.error`, which is invisible in a SharedWorker, so the text
 * is intercepted here: logged through `Logger` (relayed to the main thread, and picked up as a Sentry
 * breadcrumb) and kept for `maybeWrapAsSearchLibraryError` to attach to the error that actually
 * reaches Sentry.
 *
 * Interception is the only channel available: the library ships `console_error_panic_hook` and
 * exposes no panic callback.
 */
const PANIC_PREFIX = 'panicked at';

let installed = false;
let lastPanic: string | undefined;

export function installWasmPanicCapture(): void {
    if (installed) {
        return;
    }
    installed = true;
    setPanicHook();

    const originalConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
        const [first] = args;
        if (typeof first === 'string' && first.startsWith(PANIC_PREFIX)) {
            // The hook formats as "panicked at <file>:<line>:<col>:\n<message>\n\nStack:\n...". Only
            // the first two lines are useful: what follows is the wasm-bindgen JS shim, not Rust
            // frames.
            lastPanic = first.split('\n').slice(0, 2).join(' ');
            Logger.error(`Search library WASM panic: ${lastPanic}`);
        }
        originalConsoleError(...args);
    };
}

/** The most recent Rust panic text, if any. Reading it clears it. */
export function takeLastWasmPanic(): string | undefined {
    const panic = lastPanic;
    lastPanic = undefined;
    return panic;
}
