import setupWasm from 'argon2id/lib/setup.js';

const wasmSIMD = new URL('argon2id/dist/simd.wasm', import.meta.url);
const wasmNoSIMD = new URL('argon2id/dist/no-simd.wasm', import.meta.url);

let SIMD: Promise<Response>;
let NO_SIMD: Promise<Response>;

const loadWasm = async () => {
    SIMD = SIMD ?? fetch(wasmSIMD);
    NO_SIMD = NO_SIMD ?? fetch(wasmNoSIMD);

    const instantiate = (source: Promise<Response>) => (imports: WebAssembly.Imports) =>
        WebAssembly.instantiateStreaming(
            source.then((res) => res.clone()),
            imports
        );

    return setupWasm(instantiate(SIMD), instantiate(NO_SIMD));
};

export default loadWasm;
