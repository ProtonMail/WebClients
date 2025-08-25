/** Custom WASM loader because `argon2id` expects `wasm-loader` which inlines WASM
 * as base64. Webpack's default WASM handling doesn't allow controlling the
 * `importsObject` needed for memory management. This enables module reloading
 * to free memory and avoids base64 inlining flagged by Chrome store reviewers */
import setupWasm from 'argon2id/lib/setup.js';

const wasmSIMD = new URL('argon2id/dist/simd.wasm', import.meta.url);
const wasmNoSIMD = new URL('argon2id/dist/no-simd.wasm', import.meta.url);

const CACHE = new Map<URL, Response>();

/** Fetches WASM file with response-level caching.
 * Returns cloned response to ensure fresh readable streams. */
const fetchWASM = async (url: URL): Promise<Response> => {
    const cached = CACHE.get(url);
    if (cached) return cached.clone();

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch WASM ${url.toString()}`);

    CACHE.set(url, response);
    return response.clone();
};

const instantiate =
    (url: URL) =>
    async (imports: WebAssembly.Imports): Promise<WebAssembly.WebAssemblyInstantiatedSource> => {
        const response = await fetchWASM(url);

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            return WebAssembly.instantiateStreaming(response, imports);
        } else {
            const buffer = await response.arrayBuffer();
            return WebAssembly.instantiate(buffer, imports);
        }
    };

export default () => setupWasm(instantiate(wasmSIMD), instantiate(wasmNoSIMD));
