import { FAILED_TO_DOWNLOAD } from '@proton/llm/lib/constants';
import { postMessageIframeToParent } from '@proton/llm/lib/helpers';
import * as _ndarrayCache from '@proton/llm/resources/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/ndarray-cache.json';
import throttle from '@proton/utils/throttle';

import type { AssistantConfig, AssistantConfigModel } from './types';
import { AssistantEvent } from './types';

type NdarrayCache = {
    metadata: {
        ParamSize: number;
        ParamBytes: number;
        BitsPerParam: number;
    };
    records: {
        dataPath: string;
        format: string;
        nbytes: number;
        records: {
            name: string;
            shape: number[];
            dtype: string;
            format: string;
            nbytes: number;
            byteOffset: number;
        }[];
        md5sum: string;
    }[];
};

const ndarrayCache = _ndarrayCache as NdarrayCache;

export enum CacheId {
    WASM = 'webllm/wasm',
    MODEL = 'webllm/model',
    CONFIG = 'webllm/config',
}

export type LlmFile = {
    downloadUrl: string;
    cacheUrl: string;
    cacheKey: string;
    cacheId: CacheId;
    expectedSize?: number;
};

export type DownloadResult = {
    headers: string;
    chunks: Uint8Array<ArrayBuffer>[];
    statusText: string;
    status: number;
};

export type AppCaches = { [k in CacheId]: Cache };

// A function to monitor the progress of a single file.
type OneFileProgressCallback = (url: string, received: number, total: number) => void;

/**
 * Functions used on the iframe app to
 * - Download the files that we need to use the model
 * - Send download events to the parent app
 */

// Initiate a download, monitors the progress, and returns the result when finished.
async function downloadFile(
    downloadUrl: string,
    callback: OneFileProgressCallback,
    abortController: AbortController
): Promise<DownloadResult> {
    const signal = abortController.signal;
    const response = await fetch(downloadUrl, { signal });
    const { status, statusText, ok } = response;
    if (!ok) {
        throw Error(`${downloadUrl}: ${FAILED_TO_DOWNLOAD} ${status} ${statusText}`);
    }
    const headers = new Headers(response.headers);
    const reader = response.body?.getReader();
    const contentLength = +response.headers.get('Content-Length')!;
    let receivedLength = 0;
    const chunks: Uint8Array<ArrayBuffer>[] = [];

    // Debounce the progress callback call to avoid sending too many events to the iframe parent
    const debouncedCallback = throttle((callback) => {
        callback();
    }, 200);

    while (true) {
        const { done, value } = await reader!.read();
        if (done) {
            break;
        }
        chunks.push(value);
        receivedLength += value.length;
        const totalReceivedLength = receivedLength;
        debouncedCallback(() => callback(downloadUrl, totalReceivedLength, contentLength));
    }
    const headersMap = Object.fromEntries(headers);
    const serializedHeaders = JSON.stringify(headersMap);
    return { status, statusText, headers: serializedHeaders, chunks };
}

// Compute the file url using the model_url so that we cache the file correctly in the parent app
async function downloadFilesSequentially(
    files: LlmFile[],
    callback: OneFileProgressCallback,
    abortController: AbortController,
    filesToIgnore: LlmFile[],
    variantConfig: AssistantConfigModel,
    parentURL: string
) {
    let filesDownloaded = 0;
    const totalFilesToDownload = files.length - filesToIgnore.length;
    for (let i = 0; i < files.length; i++) {
        if (abortController.signal.aborted) return;

        const { downloadUrl, cacheUrl, cacheId } = files[i];

        // Do not download files that have already been downloaded and cached
        const ignoreThisFile = filesToIgnore.some((f) => f.downloadUrl === downloadUrl);
        if (!ignoreThisFile) {
            // Start the download for a new file.
            const downloadResult = await downloadFile(downloadUrl, callback, abortController);
            filesDownloaded++;

            postMessageIframeToParent(
                {
                    type: AssistantEvent.DOWNLOAD_DATA,
                    payload: {
                        downloadResult: {
                            headers: downloadResult.headers,
                            chunks: downloadResult.chunks,
                            status: downloadResult.status,
                            statusText: downloadResult.statusText,
                        },
                        // use the parent model url so that we put the right element in cache
                        cacheId,
                        cacheUrl,
                        terminate: filesDownloaded === totalFilesToDownload,
                    },
                },
                parentURL,
                downloadResult.chunks.map((chunk) => chunk.buffer)
            );
        }
    }
}

// Prepare the list of all the files we need to download
function listFilesToDownload(variantConfig: AssistantConfigModel): LlmFile[] {
    // From the iframe, we are downloading files using the model_download_url
    // Then, before sending an event to the parent app,
    // we will update the url so that we use the model_url domain instead for the file caching
    const baseKey = new URL(variantConfig.model_download_url).pathname;
    const baseDownloadUrl = variantConfig.model_download_url;
    const baseCacheUrl = variantConfig.model_url;

    // Since we don't have access to the app using the model from the cache,
    // put the destination cache identifiers
    const files: LlmFile[] = [];
    files.push({
        // "webllm/model" -> ".../mlc-chat-config.json"
        downloadUrl: new URL('mlc-chat-config.json', baseDownloadUrl).href,
        cacheUrl: new URL('mlc-chat-config.json', baseCacheUrl).href,
        cacheKey: `${baseKey}mlc-chat-config.json`,
        cacheId: CacheId.CONFIG,
    });

    files.push({
        // "webllm/model" -> ".../tokenizer.json"
        downloadUrl: new URL('tokenizer.json', baseDownloadUrl).href,
        cacheUrl: new URL('tokenizer.json', baseCacheUrl).href,
        cacheKey: `${baseKey}tokenizer.json`,
        cacheId: CacheId.MODEL,
    });

    files.push(
        ...ndarrayCache.records.map((record) => ({
            // "webllm/model" -> ".../params_shard_*.bin"
            downloadUrl: new URL(record.dataPath, baseDownloadUrl).href,
            cacheUrl: new URL(record.dataPath, baseCacheUrl).href,
            cacheKey: `${baseKey}${record.dataPath}`,
            cacheId: CacheId.MODEL,
            expectedSize: record.nbytes,
        }))
    );
    return files;
}

// Retrieves all the files that we need to use the model
export async function downloadModel(
    variant: string,
    assistantConfig: AssistantConfig,
    abortController: AbortController,
    filesToIgnore: LlmFile[],
    parentURL: string
) {
    // Grab the entry for our chosen model inside mlc-config.
    const variantConfig = assistantConfig.model_list.find((m) => m.model_id === variant);
    if (variantConfig === undefined) {
        console.error(`Model not found in MLC config: ${variant}`);
        throw Error(`Model not found in MLC config: ${variant}`);
    }

    // Prepare a list of files to download
    const files = listFilesToDownload(variantConfig);

    // This first map tracks how many bytes we need to download.
    //   { url: expectedSize }.
    // Thanks to it, we can compute the total overall size to download by summing the values.
    // For most files, especially for the model weights, the size is specified in a meta file, so we know it upfront.
    // Unfortunately, some small files (like wasm and tokenizer.json) have an unknown size. However, we start to fetch
    // it, Content-Length should tell us the real size. Therefore, this map will be modified a few times, as we fetch
    // some of these files that have an initially unknown size.
    const expectedSizes: Map<string, number> = new Map();
    for (const f of files) {
        if (f.expectedSize) {
            expectedSizes.set(f.downloadUrl, f.expectedSize!);
        }
    }
    const overallExpectedSize = () => [...expectedSizes.values()].reduce((acc, n) => acc + n, 0);

    // This second map tracks how many bytes we have received for each file.
    //   { url: receivedSize }
    // The purpose is to track the overall bytes we've downloaded so far. We compute this by summing the values too.
    // Consequently, it will be frequently updated, namely each time we receive a new chunk of data.
    const receivedSizes: Map<string, number> = new Map();
    for (const f of files) {
        const ignoreThisFile = filesToIgnore.some((ignored) => ignored.downloadUrl === f.downloadUrl);
        if (ignoreThisFile) {
            receivedSizes.set(f.downloadUrl, f.expectedSize || 0);
        } else {
            receivedSizes.set(f.downloadUrl, 0);
        }
    }
    const overallReceived = () => [...receivedSizes.values()].reduce((acc, n) => acc + n, 0);

    const nFinishedFiles = () =>
        files.filter((f) => {
            const r = receivedSizes.get(f.downloadUrl);
            const e = expectedSizes.get(f.downloadUrl);
            return r !== undefined && e !== undefined && r >= e;
        }).length;

    // Start downloading files
    const updateProgressOneFile = (downloadUrl: string, received: number, total: number) => {
        if (!expectedSizes.has(downloadUrl) && total > 0) {
            expectedSizes.set(downloadUrl, total);
        }
        const receivedCapped = Math.min(received, total);
        receivedSizes.set(downloadUrl, receivedCapped);
        const r = overallReceived();
        const e = overallExpectedSize();

        // Send a message to the parent app so that we can update the download progress
        postMessageIframeToParent(
            {
                type: AssistantEvent.DOWNLOAD_PROGRESS,
                payload: {
                    progress: {
                        receivedBytes: r,
                        estimatedTotalBytes: e,
                        receivedFiles: nFinishedFiles(),
                        totalFiles: files.length,
                    },
                },
            },
            parentURL
        );
    };
    await downloadFilesSequentially(
        files,
        updateProgressOneFile,
        abortController,
        filesToIgnore,
        variantConfig,
        parentURL
    );
}

function buildFakeResponseForCache(data: string, filename: string, origin: string) {
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const headers = new Headers({
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Expose-Headers': 'Accept-Ranges,Content-Range',
        'Content-Disposition': `inline; filename*=UTF-8''${filename}; filename="${filename}"`,
        'Content-Length': blob.size.toString(),
        'Content-Security-Policy': 'default-src none; sandbox',
        'Content-Type': 'text/plain; charset=utf-8',
        'Cross-Origin-Opener-Policy': 'same-origin',
        Date: new Date().toUTCString(),
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        Vary: 'Origin',
    });
    const response = new Response(blob, {
        status: 200,
        statusText: 'OK',
        headers: headers,
    });
    return response;
}

// Store a piece of data that we don't actually need to download
// because we already have it in a JavaScript object right here.
// This creates a fake response that looks like the server sent
// it, and stores it in the cache.
async function storeLocalDataInCache(object: any, filename: string, cacheId: Cache, origin: string, baseKey: string) {
    const data = JSON.stringify(object);
    const response = buildFakeResponseForCache(data, filename, origin);
    await cacheId.put(`${baseKey}${filename}`, response);
}

// Check if a given url is already present in the cache.
async function existsInCache(cacheUrl: string, cache: Cache, expects?: { size?: number }): Promise<boolean> {
    const cachedResponse = await cache.match(cacheUrl);
    if (!cachedResponse) {
        return false;
    }
    const expectedSize = expects?.size;

    const needsCheck = expectedSize !== undefined;
    if (!needsCheck) {
        return true;
    }

    const arrayBuffer = await cachedResponse.arrayBuffer();

    if (expectedSize !== undefined) {
        return arrayBuffer.byteLength === expectedSize;
    }

    return true;
}

// Put files that we don't need to download from the iframe in the cache
async function cacheParentAppFiles(appCaches: AppCaches, variantConfig: AssistantConfigModel) {
    // Cache files we already have statically and don't need to download. We pretend we have downloaded it, but
    // in fact we just create a fake response to a nonexistent request, pretend the server sent it to us, and store
    // it in the cache.
    const origin = window.location.origin;
    const baseKey = new URL(variantConfig.model_url).pathname;
    // - "webllm/model" -> ".../ndarray-cache.json"
    await storeLocalDataInCache(ndarrayCache, 'ndarray-cache.json', appCaches[CacheId.MODEL], origin, baseKey);

    // Cache files that we stored in the app assets
    // "webllm/wasm" -> ".../file.wasm"
    const wasmUrl = variantConfig.model_lib_url; // 'https://mail.proton.me/.../file.wasm'
    const isWasmInCache = await existsInCache(wasmUrl, appCaches[CacheId.WASM]);
    if (!isWasmInCache) {
        const wasmResponse = await fetch(wasmUrl);
        await appCaches[CacheId.WASM].put(wasmUrl, wasmResponse);
    }
}

// Search for files that we have already downloaded and stored in the cache
export async function getCachedFiles(variant: string, assistantConfig: AssistantConfig) {
    const filesAlreadyDownloaded: LlmFile[] = [];

    // Open caches
    const appCaches: AppCaches = {
        [CacheId.MODEL]: await caches.open(CacheId.MODEL),
        [CacheId.WASM]: await caches.open(CacheId.WASM),
        [CacheId.CONFIG]: await caches.open(CacheId.CONFIG),
    };

    // Grab the entry for our chosen model inside mlc-config.
    const variantConfig = assistantConfig.model_list.find((m) => m.model_id === variant);
    if (variantConfig === undefined) {
        console.error(`Model not found in MLC config: ${variant}`);
        throw Error(`Model not found in MLC config: ${variant}`);
    }

    // Put files that we don't need to download from the iframe in the cache
    await cacheParentAppFiles(appCaches, variantConfig);

    // Prepare a list of files that we need to run the model
    const files = listFilesToDownload(variantConfig);

    // Check which files are present in the cache
    for (const f of files) {
        const { cacheUrl, cacheId, expectedSize } = f;
        const exists = await existsInCache(cacheUrl, appCaches[cacheId], { size: expectedSize });

        if (exists) {
            filesAlreadyDownloaded.push(f);
        }
    }

    const needsAdditionalDownload = filesAlreadyDownloaded.length !== files.length;

    return { filesAlreadyDownloaded, needsAdditionalDownload, appCaches };
}

/**
 * Clears the cache related to the AI Assistant
 * @returns A promise that resolves when the cache is cleared
 */
export async function deleteAssistantCachedFiles() {
    return Promise.all([caches.delete(CacheId.MODEL), caches.delete(CacheId.WASM), caches.delete(CacheId.CONFIG)]);
}

// Store a fully downloaded file into the cache.
export async function storeInCache(downloadResult: DownloadResult, cacheUrl: string, cache: Cache) {
    const { status, statusText, headers, chunks } = downloadResult;
    const blob = new Blob(chunks);

    try {
        const parsedHeaders = JSON.parse(headers);
        await cache.put(cacheUrl, new Response(blob, { status, statusText, headers: parsedHeaders }));
    } catch (e) {
        throw new Error(`${cacheUrl}: error while storing in cache: ${e}`);
    }
}

// Map the destination cache ID with the cache in which we want to store files
