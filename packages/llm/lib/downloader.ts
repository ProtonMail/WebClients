import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { postMessageToAssistantParent } from '@proton/llm/lib/helpers';
import * as _ndarrayCache from '@proton/llm/resources/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/ndarray-cache.json';
import throttle from '@proton/utils/throttle';

import type { AssistantConfig } from './types';
import { ASSISTANT_EVENTS } from './types';

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

export enum DESTINATION_CACHE {
    WASM = 'webllm/wasm',
    MODEL = 'webllm/model',
    CONFIG = 'webllm/config',
}

type LlmFile = {
    url: string;
    key: string;
    destinationCache: Cache;
    expectedMd5?: string;
    expectedSize?: number;
};

type FileDownload = Omit<LlmFile, 'destinationCache'> & {
    destinationCacheID: DESTINATION_CACHE;
};

export type DownloadResult = {
    headers: string;
    chunks: Uint8Array[];
    statusText: string;
    status: number;
};

export type AppCaches = { wasm: Cache; model: Cache; config: Cache };

type VariantConfig = {
    low_resource_required: boolean;
    model_lib_url: string;
    required_features: string[];
    model_url: string;
    model_id: string;
    vram_required_MB: number;
};

// A function to monitor the progress of a single file.
type OneFileProgressCallback = (url: string, received: number, total: number) => void;

/**
 * Functions used on the iframe app to
 * - Download the files that we need to use the model
 * - Send download events to the parent app
 */

// Initiate a download, monitors the progress, and returns the result when finished.
async function downloadFile(
    url: string,
    callback: OneFileProgressCallback,
    abortController: AbortController
): Promise<DownloadResult> {
    const signal = abortController.signal;
    const response = await fetch(url, { signal });
    const { status, statusText, ok } = response;
    if (!ok) {
        throw Error(`${url}: Failed to download: ${status} ${statusText}`);
    }
    const headers = new Headers(response.headers);
    const reader = response.body?.getReader();
    const contentLength = +response.headers.get('Content-Length')!;
    let receivedLength = 0;
    const chunks = [];

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
        debouncedCallback(() => callback(url, totalReceivedLength, contentLength));
    }
    const serializedHeaders = JSON.stringify(Object.fromEntries(headers));
    return { status, statusText, headers: serializedHeaders, chunks };
}

async function downloadFilesSequentially(
    files: FileDownload[],
    callback: OneFileProgressCallback,
    abortController: AbortController,
    filesToIgnore: string[],
    parentURL: string
) {
    let filesDownloaded = 0;
    const totalFilesToDownload = files.length - filesToIgnore.length;
    for (let i = 0; i < files.length; i++) {
        if (abortController.signal.aborted) return;

        const { url, destinationCacheID, expectedMd5 } = files[i];

        // Do not download files that have already been downloaded and cached
        if (!filesToIgnore.includes(url)) {
            // Start the download for a new file.
            const downloadResult = await downloadFile(url, callback, abortController);
            filesDownloaded++;

            postMessageToAssistantParent(
                {
                    type: ASSISTANT_EVENTS.DOWNLOAD_DATA,
                    payload: {
                        downloadResult: {
                            headers: downloadResult.headers,
                            chunks: downloadResult.chunks,
                            status: downloadResult.status,
                            statusText: downloadResult.statusText,
                        },
                        url,
                        destinationCacheID,
                        expectedMd5,
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
function listFilesToDownload(variantConfig: VariantConfig) {
    const baseKey = new URL(variantConfig.model_url).pathname;
    const baseUrl = variantConfig.model_url;
    const wasmUrl = variantConfig.model_lib_url; // 'https://mail.proton.me/.../file.wasm'
    const wasmKey = new URL(variantConfig.model_lib_url).pathname; // '/.../file.wasm'

    const chatConfigURL = new URL('mlc-chat-config.json', baseUrl).href;
    const tokenizerURL = new URL('tokenizer.json', baseUrl).href;

    // Since we don't have access to the app using the model from the cache,
    // put the destination cache identifiers
    const files: FileDownload[] = [];
    files.push({
        // "webllm/model" -> ".../mlc-chat-config.json"
        url: chatConfigURL,
        key: `${baseKey}mlc-chat-config.json`,
        destinationCacheID: DESTINATION_CACHE.CONFIG,
    });

    files.push({
        // "webllm/model" -> ".../tokenizer.json"
        url: tokenizerURL,
        key: `${baseKey}tokenizer.json`,
        destinationCacheID: DESTINATION_CACHE.MODEL,
    });

    files.push({
        // "webllm/wasm" -> ".../file.wasm"
        url: wasmUrl,
        key: wasmKey,
        destinationCacheID: DESTINATION_CACHE.WASM,
    });

    files.push(
        ...ndarrayCache.records.map((record) => ({
            // "webllm/model" -> ".../params_shard_*.bin"
            url: new URL(record.dataPath, baseUrl).href,
            key: `${baseKey}${record.dataPath}`,
            destinationCacheID: DESTINATION_CACHE.MODEL,
            expectedMd5: record.md5sum,
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
    filesToIgnore: string[],
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
            expectedSizes.set(f.url, f.expectedSize!);
        }
    }
    const overallExpectedSize = () => [...expectedSizes.values()].reduce((acc, n) => acc + n, 0);

    // This second map tracks how many bytes we have received for each file.
    //   { url: receivedSize }
    // The purpose is to track the overall bytes we've downloaded so far. We compute this by summing the values too.
    // Consequently, it will be frequently updated, namely each time we receive a new chunk of data.
    const receivedSizes: Map<string, number> = new Map();
    for (const f of files) {
        if (filesToIgnore.includes(f.url)) {
            receivedSizes.set(f.url, f.expectedSize || 0);
        } else {
            receivedSizes.set(f.url, 0);
        }
    }
    const overallReceived = () => [...receivedSizes.values()].reduce((acc, n) => acc + n, 0);

    const nFinishedFiles = () =>
        files.filter((f) => {
            let r = receivedSizes.get(f.url);
            let e = expectedSizes.get(f.url);
            return r !== undefined && e !== undefined && r >= e;
        }).length;

    // Start downloading files
    const updateProgressOneFile = (url: string, received: number, total: number) => {
        if (!expectedSizes.has(url) && total > 0) {
            expectedSizes.set(url, total);
        }
        const receivedCapped = Math.min(received, total);
        receivedSizes.set(url, receivedCapped);
        const r = overallReceived();
        const e = overallExpectedSize();

        // Send a message to the parent app so that we can update the download progress
        postMessageToAssistantParent(
            {
                type: ASSISTANT_EVENTS.DOWNLOAD_PROGRESS,
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
    await downloadFilesSequentially(files, updateProgressOneFile, abortController, filesToIgnore, parentURL);
}

/**
 * Functions used on the parent app to
 * - Check which files of the model have already been downloaded
 * - Store files in the cache
 */

async function computeMd5(data: Uint8Array) {
    return arrayToHexString(await CryptoProxy.computeHash({ data, algorithm: 'unsafeMD5' }));
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
async function storeLocalDataInCache(
    object: any,
    filename: string,
    destinationCache: Cache,
    origin: string,
    baseKey: string
) {
    const data = JSON.stringify(object);
    const response = buildFakeResponseForCache(data, filename, origin);
    await destinationCache.put(`${baseKey}${filename}`, response);
}

// Check if a given url is already present in the cache, and optionally verify its MD5 checksum.
async function existsInCache(url: string, destinationCache: Cache, expectedMd5?: string) {
    let cachedResponse = await destinationCache.match(url);
    if (!cachedResponse) {
        return false;
    }
    if (!expectedMd5) {
        return true;
    }
    const arrayBuffer = await cachedResponse.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // disabling for now; it takes too long to compute checksum for cached files
    const BYPASS_CHECKSUM_FOR_CACHED_FILES = true;
    if (BYPASS_CHECKSUM_FOR_CACHED_FILES) {
        return true;
    }

    const actualMd5 = await computeMd5(data);
    if (actualMd5 === expectedMd5) {
        return true;
    }
    return false;
}

// List all files that we need to use the model
function listFilesNeeded(variantConfig: VariantConfig, appCaches: AppCaches) {
    const baseKey = new URL(variantConfig.model_url).pathname;
    const baseUrl = variantConfig.model_url;
    const wasmUrl = variantConfig.model_lib_url; // 'https://mail.proton.me/.../file.wasm'
    const wasmKey = new URL(variantConfig.model_lib_url).pathname; // '/.../file.wasm'

    const chatConfigURL = new URL('mlc-chat-config.json', baseUrl).href;
    const tokenizerURL = new URL('tokenizer.json', baseUrl).href;

    const files: LlmFile[] = [];
    files.push({
        // "webllm/model" -> ".../mlc-chat-config.json"
        url: chatConfigURL,
        key: `${baseKey}mlc-chat-config.json`,
        destinationCache: appCaches.config,
    });

    files.push({
        // "webllm/model" -> ".../tokenizer.json"
        url: tokenizerURL,
        key: `${baseKey}tokenizer.json`,
        destinationCache: appCaches.model,
    });

    files.push({
        // "webllm/wasm" -> ".../file.wasm"
        url: wasmUrl,
        key: wasmKey,
        destinationCache: appCaches.wasm,
    });

    files.push(
        ...ndarrayCache.records.map((record) => ({
            // "webllm/model" -> ".../params_shard_*.bin"
            url: new URL(record.dataPath, baseUrl).href,
            key: `${baseKey}${record.dataPath}`,
            destinationCache: appCaches.model,
            expectedMd5: record.md5sum,
            expectedSize: record.nbytes,
        }))
    );
    return files;
}

// Search for files that we have already downloaded and stored in the cache
export async function getCachedFiles(variant: string, assistantConfig: AssistantConfig) {
    const filesAlreadyDownloaded: string[] = [];

    // Open caches
    const appCaches = {
        model: await caches.open(DESTINATION_CACHE.MODEL),
        wasm: await caches.open(DESTINATION_CACHE.WASM),
        config: await caches.open(DESTINATION_CACHE.CONFIG),
    };

    // Grab the entry for our chosen model inside mlc-config.
    const variantConfig = assistantConfig.model_list.find((m) => m.model_id === variant);
    if (variantConfig === undefined) {
        console.error(`Model not found in MLC config: ${variant}`);
        throw Error(`Model not found in MLC config: ${variant}`);
    }

    // Cache files we already have statically and don't need to download. We pretend we have downloaded it, but
    // in fact we just create a fake response to a nonexistent request, pretend the server sent it to us, and store
    // it in the cache.
    const origin = window.location.origin;
    const baseKey = new URL(variantConfig.model_url).pathname;
    // - "webllm/model" -> ".../ndarray-cache.json"
    await storeLocalDataInCache(ndarrayCache, 'ndarray-cache.json', appCaches.model, origin, baseKey);

    // Prepare a list of files that we need to run the model
    const files = listFilesNeeded(variantConfig, appCaches);

    // Check which files are present in the cache
    for (const f of files) {
        const { url, destinationCache, expectedMd5 } = f;
        const exists = await existsInCache(url, destinationCache, expectedMd5);

        if (exists) {
            filesAlreadyDownloaded.push(url);
        }
    }

    const needsAdditionalDownload = filesAlreadyDownloaded.length !== files.length;

    return { filesAlreadyDownloaded, needsAdditionalDownload, appCaches };
}

// Store a fully downloaded file into the cache.
export async function storeInCache(
    downloadResult: DownloadResult,
    url: string,
    destinationCache: Cache,
    expectedMd5: string | undefined
) {
    const { status, statusText, headers, chunks } = downloadResult;
    const blob = new Blob(chunks);
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const actualMd5 = await computeMd5(data);

    if (!expectedMd5 || actualMd5 === expectedMd5) {
        try {
            const parsedHeaders = JSON.parse(headers);
            await destinationCache.put(url, new Response(blob, { status, statusText, headers: parsedHeaders }));
        } catch {
            throw new Error(`${url}: checksum failed, expected ${expectedMd5}, got ${actualMd5}`);
        }
    } else {
        throw new Error(`${url}: checksum failed, expected ${expectedMd5}, got ${actualMd5}`);
    }
}

// Map the destination cache ID with the cache in which we want to store files
export function getDestinationCacheFromID(destinationCacheID: string, appCaches: AppCaches) {
    switch (destinationCacheID) {
        case DESTINATION_CACHE.CONFIG:
            return appCaches.config;
        case DESTINATION_CACHE.MODEL:
            return appCaches.model;
        case DESTINATION_CACHE.WASM:
            return appCaches.wasm;
    }
}
