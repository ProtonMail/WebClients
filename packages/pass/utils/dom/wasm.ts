/** Minimal WASM module */
const buffer = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

export const hasWASMSupport = (): boolean => {
    try {
        if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
            const mod = new WebAssembly.Module(buffer);
            const instance = new WebAssembly.Instance(mod);
            return instance instanceof WebAssembly.Instance;
        }
    } catch {}

    return false;
};
