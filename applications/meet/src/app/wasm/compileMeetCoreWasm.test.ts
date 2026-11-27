import { MINUTE } from '@proton/shared/lib/constants';

import { compileMeetCoreWasm } from './compileMeetCoreWasm';

const wasmModule = {} as WebAssembly.Module;

const stalledFetch = (_url: URL, { signal }: RequestInit) =>
    new Promise<Response>((_, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });

beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(WebAssembly, 'compileStreaming').mockImplementation(async (response) => {
        await (await response).arrayBuffer();
        return wasmModule;
    });
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

it('fails a download that never answers', async () => {
    vi.stubGlobal('fetch', vi.fn(stalledFetch));

    const stalled = expect(compileMeetCoreWasm()).rejects.toThrow('Aborted');
    await vi.advanceTimersByTimeAsync(MINUTE);
    await stalled;
});

it('fails a download the server answers with an error status', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('Not found', { status: 404 }))
    );
    await expect(compileMeetCoreWasm()).rejects.toThrow('Meet core WASM download failed with status 404');
    expect(WebAssembly.compileStreaming).not.toHaveBeenCalled();
});
