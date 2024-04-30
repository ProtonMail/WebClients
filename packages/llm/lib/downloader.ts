import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import mlcConfig from '@proton/llm/lib/mlc-config';
import * as _ndarrayCache from '@proton/llm/resources/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/ndarray-cache.json';

import type { NdarrayCache } from './types';

const ndarrayCache = _ndarrayCache as NdarrayCache;

type FileDownload = {
    url: string;
    key: string;
    destinationCache: Cache;
    expectedMd5?: string;
    progress: number;
};

type UpdateProgressCallback = (url: string, progress: number) => void;

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
async function existsInCache(url: string, destinationCache: Cache, expectedMd5: string | undefined) {
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
async function downloadFile(url: string, updateProgress: UpdateProgressCallback): Promise<DownloadResult> {
    const response = await fetch(url);
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
        updateProgress(url, (receivedLength / contentLength) * 100);
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

async function downloadFilesSequentially(files: FileDownload[], updateProgress: UpdateProgressCallback) {
    const promises = [];
    for (let i = 0; i < files.length; i++) {
        const { url, destinationCache, expectedMd5 } = files[i];

        // First, check if we already have this file cached.
        let skip = await existsInCache(url, destinationCache, expectedMd5);
        if (skip) continue;

        // Start the download for a new file.
        const downloadResult = await downloadFile(url, updateProgress);

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

    const files: FileDownload[] = ndarrayCache.records.map((record) => ({
        // "webllm/model" -> ".../params_shard_*.bin"
        url: new URL(record.dataPath, baseUrl).href,
        key: `${baseKey}${record.dataPath}`,
        destinationCache: appCaches.model,
        expectedMd5: record.md5sum,
        progress: 0,
    }));
    files.push({
        // "webllm/model" -> ".../tokenizer.json"
        url: new URL('tokenizer.json', baseUrl).href,
        key: `${baseKey}tokenizer.json`,
        destinationCache: appCaches.model,
        progress: 0,
    });
    files.push({
        // "webllm/model" -> ".../mlc-chat-config.json"
        url: new URL('mlc-chat-config.json', baseUrl).href,
        key: `${baseKey}mlc-chat-config.json`,
        destinationCache: appCaches.config,
        progress: 0,
    });
    files.push({
        // "webllm/wasm" -> ".../file.wasm"
        url: wasmUrl,
        key: wasmKey,
        destinationCache: appCaches.wasm,
        progress: 0,
    });
    return files;
}

export async function downloadModel(variant: string) {
    // Open caches
    const appCaches = {
        model: await caches.open('webllm/model'),
        wasm: await caches.open('webllm/wasm'),
        config: await caches.open('webllm/config'),
    };

    // Grab the entry for our chosen model inside mlc-config.
    const variantConfig = mlcConfig.model_list.find((m) => m.model_id === variant);
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

    // Start downloading files
    const updateProgress = (url: string, progress: number) => {
        /* eslint-disable-next-line no-console */
        console.log(`${url}: downloading, progress: ${progress.toFixed(2)}%`);
    };
    await downloadFilesSequentially(files, updateProgress);
}
