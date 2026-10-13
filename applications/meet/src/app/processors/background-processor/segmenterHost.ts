import { withTimeout } from '@proton/meet/utils/withTimeout';

import { DEFAULT_ASSET_PATH, DEFAULT_MODEL_PATH } from './constants';
import type { TunableConstantsOverrides } from './tunableConstants';

const CACHE_NAME = 'proton-meet-background-blur-v1';

const WORKER_INIT_TIMEOUT_MS = 10000;

export interface SegmenterAssetPaths {
    tasksVisionFileSet?: string;
    modelAssetPath?: string;
}

export interface SegmenterHandle {
    delegate: 'GPU' | 'CPU';
    connect: () => MessagePort;
    terminate: () => void;
}

const fetchWithCache = async (url: string): Promise<Response> => {
    if (!('caches' in window)) {
        return fetch(url);
    }

    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
            return cachedResponse;
        }

        const response = await fetch(url);
        if (response.ok) {
            await cache.put(url, response.clone());
        }
        return response;
    } catch {
        return fetch(url);
    }
};

export const preloadBackgroundBlurAssets = async (assetPaths?: SegmenterAssetPaths) => {
    if (!('caches' in window)) {
        return;
    }

    const filesetPath = assetPaths?.tasksVisionFileSet ?? DEFAULT_ASSET_PATH;
    const modelPath = assetPaths?.modelAssetPath ?? DEFAULT_MODEL_PATH;

    const wasmFiles = [`${filesetPath}/vision_wasm_internal.wasm`, `${filesetPath}/vision_wasm_internal.js`, modelPath];

    try {
        const cache = await caches.open(CACHE_NAME);

        await Promise.all(
            wasmFiles.map(async (url) => {
                try {
                    const cached = await cache.match(url);
                    if (!cached) {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                        }
                    }
                } catch {
                    // Ignore individual fetch errors
                }
            })
        );
    } catch {
        // Cache API failed, but don't block
    }
};

export const startSegmenter = async ({
    assetPaths,
    delegate,
    constantOverrides,
    onCrash,
}: {
    assetPaths?: SegmenterAssetPaths;
    delegate: 'GPU' | 'CPU';
    constantOverrides: TunableConstantsOverrides;
    onCrash: (error: Error) => void;
}): Promise<SegmenterHandle> => {
    const filesetPath = assetPaths?.tasksVisionFileSet ?? DEFAULT_ASSET_PATH;
    const modelPath = assetPaths?.modelAssetPath ?? DEFAULT_MODEL_PATH;

    const [wasmLoaderResponse, wasmBinaryResponse, modelResponse] = await Promise.all([
        fetchWithCache(`${filesetPath}/vision_wasm_internal.js`),
        fetchWithCache(`${filesetPath}/vision_wasm_internal.wasm`),
        fetchWithCache(modelPath),
    ]);

    const [wasmLoaderBlob, wasmBinaryBlob, modelBuffer] = await Promise.all([
        wasmLoaderResponse.blob(),
        wasmBinaryResponse.blob(),
        modelResponse.arrayBuffer(),
    ]);

    const wasmLoaderUrl = URL.createObjectURL(wasmLoaderBlob);
    const wasmBinaryUrl = URL.createObjectURL(wasmBinaryBlob);

    const worker = new Worker(
        /* webpackChunkName: "background-segmenter-worker" */
        new URL('./segmenter.worker.ts', import.meta.url),
        { type: 'module' }
    );

    const terminate = () => {
        try {
            worker.postMessage({ type: 'destroy' });
        } catch {
            // ignore
        }
        worker.terminate();
    };

    try {
        const activeDelegate = await withTimeout(
            new Promise<'GPU' | 'CPU'>((resolve, reject) => {
                worker.onmessage = (event: MessageEvent) => {
                    if (event.data?.type === 'ready') {
                        resolve(event.data.delegate);
                    } else if (event.data?.type === 'error') {
                        reject(new Error(event.data.message ?? 'worker init failed'));
                    }
                };
                worker.onerror = (event: ErrorEvent) => {
                    reject(new Error(`Background segmenter worker error: ${event.message}`));
                };

                worker.postMessage(
                    {
                        type: 'init',
                        wasmLoaderUrl,
                        wasmBinaryUrl,
                        modelBuffer,
                        delegate,
                        constantOverrides,
                    },
                    [modelBuffer]
                );
            }),
            'Background segmenter worker init',
            WORKER_INIT_TIMEOUT_MS
        );

        worker.onmessage = null;
        worker.onerror = (event: ErrorEvent) => {
            onCrash(new Error(`Background segmenter worker error: ${event.message}`));
        };

        // eslint-disable-next-line no-console
        console.log(`[bg-processor] worker ready delegate=${activeDelegate} model=${modelPath.split('/').pop()}`);

        return {
            delegate: activeDelegate,
            connect: () => {
                const channel = new MessageChannel();
                worker.postMessage({ type: 'connect', port: channel.port1 }, [channel.port1]);
                return channel.port2;
            },
            terminate,
        };
    } catch (error) {
        terminate();
        throw error;
    } finally {
        URL.revokeObjectURL(wasmLoaderUrl);
        URL.revokeObjectURL(wasmBinaryUrl);
    }
};
