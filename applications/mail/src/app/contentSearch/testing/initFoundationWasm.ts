import { readFileSync } from 'fs';
import { dirname, join } from 'path';

import initFoundation from '@proton/proton-foundation-search';

let initPromise: Promise<unknown> | undefined;

/**
 * Initialise the foundation-search wasm module for tests.
 *
 * wasm-bindgen's default init `fetch`es the `.wasm` URL, which fails under Node, so we read the
 * bytes from the installed package and hand them to the init function directly. Idempotent: the
 * module is instantiated at most once per test file (jest resets module state between files).
 */
export function initFoundationWasm(): Promise<unknown> {
    if (!initPromise) {
        const pkgDir = dirname(require.resolve('@proton/proton-foundation-search'));
        const wasm = readFileSync(join(pkgDir, 'proton_foundation_search_bg.wasm'));
        initPromise = initFoundation({ module_or_path: wasm });
    }
    return initPromise;
}
