import { SECOND } from '@proton/shared/lib/constants';

const meetCoreWasmUrl = new URL('@proton-meet/proton-meet-core/index_bg.wasm', import.meta.url);

// Generous, since the browser can hold a low-priority request behind the requests of the first screen
const RESPONSE_TIMEOUT_MS = 30 * SECOND;

const fetchMeetCoreWasm = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RESPONSE_TIMEOUT_MS);
    try {
        // Low, so the download does not slow what the first screen needs: joining waits for meet-core anyway
        const response = await fetch(meetCoreWasmUrl, { priority: 'low', signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Meet core WASM download failed with status ${response.status}`);
        }
        // compileStreaming rejects a response the server did not send with the application/wasm MIME type
        return new Response(response.body, { headers: { 'Content-Type': 'application/wasm' } });
    } finally {
        clearTimeout(timeout);
    }
};

export const compileMeetCoreWasm = async (): Promise<WebAssembly.Module> => {
    const response = await fetchMeetCoreWasm();
    // Safari before 15 has no compileStreaming
    if (typeof WebAssembly.compileStreaming !== 'function') {
        return WebAssembly.compile(await response.arrayBuffer());
    }
    return WebAssembly.compileStreaming(response);
};
