import init, { enableTracing, setPanicHook } from '@proton/proton-foundation-search';

let initializedWasm = false;
export async function initWasm(): Promise<void> {
    if (!initializedWasm) {
        await init();
        // tell rust what to do when there is a panic, akin to an uncaught exception,
        // which here will be to log to the console.
        setPanicHook();
        // enable further logging
        enableTracing();
        initializedWasm = true;
    }
}
