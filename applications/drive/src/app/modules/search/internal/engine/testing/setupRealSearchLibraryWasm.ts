import { readFileSync } from 'fs';

import { initSync } from '@proton/proton-foundation-search';

/**
 * Initialize the search foundation WASM engine synchronously for tests.
 * Must be called before any test that uses the real WASM engine.
 */
export function setupRealSearchLibraryWasm(): void {
    const wasmBytes = readFileSync(
        require.resolve('@proton/proton-foundation-search/proton_foundation_search_bg.wasm')
    );
    initSync({ module: wasmBytes });
}
