interface WasmApi {
    instance: {
        exports: {
            b64_output: {
                value: number;
            };
            solve: () => number;
            memory: {
                buffer: ArrayBuffer;
            };
        };
    };
}

self.onmessage = async function (event) {
    const { b64Source } = event.data;

    const decodeBase64 = (base64: string) => {
        return atob(base64);
    };

    const decodeWasmBinary = (base64: string) => {
        const text = decodeBase64(base64);
        const binary = new Uint8Array(new ArrayBuffer(text.length));
        for (let i = 0; i < text.length; i++) {
            binary[i] = text.charCodeAt(i);
        }
        return binary;
    };

    const loadWasmModule = async (source: string) => {
        const wasmBinary = decodeWasmBinary(source);
        const result = await WebAssembly.instantiate(wasmBinary);
        return result as typeof result & WasmApi;
    };

    const result = await loadWasmModule(b64Source);
    const b64OutputPtr = result.instance.exports.b64_output.value;
    const startTime = Date.now();
    const b64OutputLen = result.instance.exports.solve();
    const endTime = Date.now();
    const duration = endTime - startTime;
    const b64Output = new Uint8Array(result.instance.exports.memory.buffer, b64OutputPtr, b64OutputLen);
    const b64 = new TextDecoder().decode(b64Output);
    self.postMessage(b64 + `, ${duration}`);
};
