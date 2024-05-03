import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import * as _ndarrayCache from '@proton/llm/resources/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/ndarray-cache.json';

import type { AssistantConfig, DownloadProgressCallback } from './types';

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

type FileDownload = {
    url: string;
    key: string;
    destinationCache: Cache;
    expectedMd5?: string;
    expectedSize?: number;
};

type DownloadResult = {
    headers: Headers;
    chunks: Uint8Array[];
    statusText: string;
    status: number;
};

type AppCaches = { wasm: Cache; model: Cache; config: Cache };

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
    while (true) {
        const { done, value } = await reader!.read();
        if (done) {
            break;
        }
        chunks.push(value);
        receivedLength += value.length;
        callback(url, receivedLength, contentLength);
    }
    return { status, statusText, headers, chunks };
}

// Store a fully downloaded file into the cache.
async function storeInCache(
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
        await destinationCache.put(url, new Response(blob, { status, statusText, headers }));
    } else {
        throw new Error(`${url}: checksum failed, expected ${expectedMd5}, got ${actualMd5}`);
    }
}

async function downloadFilesSequentially(
    files: FileDownload[],
    callback: OneFileProgressCallback,
    abortController: AbortController
) {
    const promises = [];
    for (let i = 0; i < files.length; i++) {
        if (abortController.signal.aborted) return;

        const { url, destinationCache, expectedMd5 } = files[i];

        // First, check if we already have this file cached.
        let skip = await existsInCache(url, destinationCache, expectedMd5);
        if (skip) continue;

        // Start the download for a new file.
        const downloadResult = await downloadFile(url, callback, abortController);

        // The following can take several seconds, so we let the promise run while
        // we loop and start another download.
        const promise = storeInCache(downloadResult, url, destinationCache, expectedMd5);
        promises.push(promise);
    }

    // Make sure all download are stored in the cache.
    await Promise.all(promises);
}

function listFilesToDownload(variantConfig: VariantConfig, appCaches: AppCaches) {
    const baseKey = new URL(variantConfig.model_url).pathname;
    const baseUrl = variantConfig.model_url;
    const wasmUrl = variantConfig.model_lib_url; // 'https://mail.proton.me/.../file.wasm'
    const wasmKey = new URL(variantConfig.model_lib_url).pathname; // '/.../file.wasm'

    const files: FileDownload[] = [];
    files.push({
        // "webllm/model" -> ".../mlc-chat-config.json"
        url: new URL('mlc-chat-config.json', baseUrl).href,
        key: `${baseKey}mlc-chat-config.json`,
        destinationCache: appCaches.config,
    });
    files.push({
        // "webllm/model" -> ".../tokenizer.json"
        url: new URL('tokenizer.json', baseUrl).href,
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

// Retrieves all the files in the model config and puts them in LocalCache where Web-LLM expects to see them.
export async function downloadModel(
    variant: string,
    updateProgress: DownloadProgressCallback,
    assistantConfig: AssistantConfig,
    abortController: AbortController
) {
    // Open caches
    const appCaches = {
        model: await caches.open('webllm/model'),
        wasm: await caches.open('webllm/wasm'),
        config: await caches.open('webllm/config'),
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

    // Prepare a list of files to download and where to cache them.
    const files = listFilesToDownload(variantConfig, appCaches);

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
    const promises = [];
    for (const f of files) {
        const promise = existsInCache(f.url, f.destinationCache).then((exists) => {
            if (exists) {
                // mark the file as downloaded
                receivedSizes.set(f.url, f.expectedSize || 0);
            } else {
                // mark as not yet downloaded
                receivedSizes.set(f.url, 0);
            }
        });
        promises.push(promise);
    }
    await Promise.all(promises);
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
        updateProgress({
            receivedBytes: r,
            estimatedTotalBytes: e,
            receivedFiles: nFinishedFiles(),
            totalFiles: files.length,
        });
    };
    await downloadFilesSequentially(files, updateProgressOneFile, abortController);
}
