import initHtmlToText from '@protontech/mail-html-to-text-fast-wasm';
import { readFileSync } from 'fs';

import initFoundation from '@proton/proton-foundation-search';

let initPromise: Promise<unknown> | undefined;

/**
 * Initialise the wasm modules content search relies on for tests: foundation-search and the
 * html-to-text stripper used when indexing bodies.
 *
 * wasm-bindgen's default init `fetch`es the `.wasm` URL, which fails under Node, so we read the
 * bytes from the installed packages and hand them to the init functions directly. Idempotent: the
 * modules are instantiated at most once per test file (jest resets module state between files).
 */
export function initContentSearchWasm(): Promise<unknown> {
    if (!initPromise) {
        initPromise = Promise.all([
            initFoundation({
                module_or_path: readFileSync(
                    require.resolve('@proton/proton-foundation-search/proton_foundation_search_bg.wasm')
                ),
            }),
            initHtmlToText({
                module_or_path: readFileSync(
                    require.resolve('@protontech/mail-html-to-text-fast-wasm/mail_html_to_text_fast_wasm_bg.wasm')
                ),
            }),
        ]);
    }
    return initPromise;
}
