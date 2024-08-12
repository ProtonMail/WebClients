export const isWasmSupported = () => {
    try {
        if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module) {
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
            }
        }
    } catch (e) {}

    return false;
};
