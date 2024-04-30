/* eslint-disable no-console */
import '@mlc-ai/web-llm';
import type { InitProgressReport } from '@mlc-ai/web-llm';
import { WebWorkerEngine } from '@mlc-ai/web-llm';

import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { BaseRunningAction } from '@proton/llm/lib/runningAction';
import * as _ndarrayCache from '@proton/llm/resources/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/ndarray-cache.json';

import mlcConfig from './mlc-config';
import type {
    Action,
    GenerationCallback,
    LlmManager,
    LlmModel,
    MonitorDownloadCallback,
    NdarrayCache,
    RunningAction,
    ShortenAction,
    WriteFullEmailAction,
} from './types';

const ndarrayCache = _ndarrayCache as NdarrayCache;

const INSTRUCTIONS_WRITE_FULL_EMAIL = [
    'You write email messages according to the description provided by the user.',
    'You do not use emojis.',
    'There should be no subject, directly write the body of the message.',
    'The signature at the end should stop after the closing salutation.',
].join(' ');

const INSTRUCTIONS_SHORTEN = [
    "Now, you shorten the part of the email that's in the the input below.",
    'Only summarize the part below and do not add anything else.',
].join(' ');

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
}

async function computeMd5(data: Uint8Array) {
    return arrayToHexString(await CryptoProxy.computeHash({ data, algorithm: 'unsafeMD5' }));
}

type Turn = {
    role: string;
    contents?: string;
};

function formatPrompt(turns: Turn[]): string {
    return turns
        .map((turn) => {
            let contents = turn.contents || '';
            let oldContents;
            do {
                oldContents = contents;
                contents = contents
                    .replaceAll(/<\|[^<>|]+\|>/g, '') // remove <|...|> markers
                    .replaceAll(/<\||\|>/g, '') // remove <| and |>
                    .trim();
            } while (contents != oldContents);
            return `<|${turn.role}|>\n${contents}`;
        })
        .join('\n\n');
}

export class GpuWriteFullEmailRunningAction extends BaseRunningAction {
    constructor(action: WriteFullEmailAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPrompt([
            {
                role: 'instructions',
                contents: INSTRUCTIONS_WRITE_FULL_EMAIL,
            },
            {
                role: 'user',
                contents: action.prompt,
            },
            {
                role: 'assistant',
            },
        ]);
        super(prompt, callback, chat, action);
    }
}

export class GpuShortenRunningAction extends BaseRunningAction {
    constructor(action: ShortenAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPrompt([
            {
                role: 'system',
                contents: INSTRUCTIONS_WRITE_FULL_EMAIL,
            },
            {
                role: 'email',
                contents: action.fullEmail,
            },
            {
                role: 'system',
                contents: INSTRUCTIONS_SHORTEN,
            },
            {
                role: 'long_part',
                contents: action.partToRephase,
            },
            {
                role: 'short_part',
            },
        ]);
        super(prompt, callback, chat, action);
    }
}

export class GpuLlmModel implements LlmModel {
    private chat: WebWorkerEngine;

    private manager: GpuLlmManager;

    constructor(chat: WebWorkerEngine, manager: GpuLlmManager) {
        this.chat = chat;
        this.manager = manager;
    }

    async unload(): Promise<void> {
        await this.chat.unload();
        this.manager.unload();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async performAction(action: Action, callback: GenerationCallback): Promise<RunningAction> {
        switch (action.type) {
            case 'writeFullEmail':
                return new GpuWriteFullEmailRunningAction(action, this.chat, callback);
            case 'shorten':
                return new GpuShortenRunningAction(action, this.chat, callback);
            default:
                throw Error('unimplemented');
        }
    }
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

type DownloadResult = {
    headers: Headers;
    chunks: Uint8Array[];
    statusText: string;
    status: number;
};

// @ts-ignore
export class GpuLlmManager implements LlmManager {
    private chat: WebWorkerEngine | undefined;

    private status: undefined | 'downloading' | 'loading' | 'loaded' | 'unloaded' | 'error';

    private model: GpuLlmModel | undefined; // defined iff status === 'loaded'

    constructor() {
        this.chat = undefined;
        this.status = undefined;
    }

    hasGpu(): boolean {
        throw Error('todo');
    }

    isDownloading(): boolean {
        return this.status === 'downloading';
    }

    async startDownload(callback: MonitorDownloadCallback): Promise<void> {
        await this.mlcDownloadAndLoadToGpu(callback);
    }

    private async downloadModel(variant: string) {
        interface FileDownload {
            url: string;
            key: string;
            destinationCache: Cache;
            progress: number;
            expectedMd5?: string;
        }

        // Open caches
        console.log('Opening caches...');
        const appCaches = {
            model: await caches.open('webllm/model'),
            wasm: await caches.open('webllm/wasm'),
            config: await caches.open('webllm/config'),
        };
        console.log('Caches open');

        // Grab the entry for our chosen model inside mlc-config.
        const variantConfig = mlcConfig.model_list.find((m) => m.model_id === variant);
        if (variantConfig === undefined) {
            console.error(`Model not found in MLC config: ${variant}`);
            throw Error(`Model not found in MLC config: ${variant}`);
        }

        const origin = window.location.origin;
        const baseKey = new URL(variantConfig.model_url).pathname;
        console.log(`baseKey = ${baseKey}`);

        // Store a piece of data that we don't actually need to download
        // because we already have it in a JavaScript object right here.
        // This creates a fake response that looks like the server sent
        // it, and stores it in the cache.
        async function storeLocalDataInCache(filename: string, object: any, destinationCache: Cache) {
            console.log(`storing ${filename}`);
            const data = JSON.stringify(object);
            const response = buildFakeResponseForCache(data, filename, origin);
            await destinationCache.put(`${baseKey}${filename}`, response);
        }

        // Cache files we already have statically and don't need to download:
        // - "webllm/model" -> ".../ndarray-cache.json"
        await storeLocalDataInCache('ndarray-cache.json', ndarrayCache, appCaches.model);

        // Prepare a list of files to download and where to cache them
        const baseUrl = new URL(variantConfig.model_url);
        console.log(`baseUrl = ${baseUrl}`);
        const files: FileDownload[] = ndarrayCache.records.map((record) => ({
            // "webllm/model" -> ".../params_shard_*.bin"
            url: new URL(record.dataPath, baseUrl).href,
            key: `${baseKey}${record.dataPath}`,
            destinationCache: appCaches.model,
            progress: 0,
            expectedMd5: record.md5sum,
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

        const wasmUrl = variantConfig.model_lib_url; // 'https://mail.proton.me/.../file.wasm'
        const wasmKey = new URL(variantConfig.model_lib_url).pathname; // '/.../file.wasm'
        console.log(`wasmUrl = ${wasmUrl}`);
        console.log(`wasmKey = ${wasmKey}`);
        files.push({
            // "webllm/wasm" -> ".../file.wasm"
            url: wasmUrl,
            key: wasmKey,
            destinationCache: appCaches.wasm,
            progress: 0,
        });

        console.log('Files to download: ');
        console.log(files);

        const updateProgress = (url: string, progress: number) => {
            console.log(`${url}: downloading, progress: ${progress.toFixed(2)}%`);
        };

        // Initiate a download.
        async function downloadFile(url: string): Promise<DownloadResult> {
            const response = await fetch(url);
            const { status, statusText, ok } = response;
            if (!ok) {
                throw Error(`${url}: Failed to download: ${status} ${statusText}`);
            }
            const headers = new Headers(response.headers);
            const reader = response.body?.getReader();
            const contentLength = +response.headers.get('Content-Length')!;
            console.log(`${url}: content length: ${contentLength}`);
            let receivedLength = 0;
            const chunks = [];
            while (true) {
                const { done, value } = await reader!.read();
                if (done) {
                    console.log(`${url}: done`);
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
            console.log(`${url}: creating blob`);
            const blob = new Blob(chunks);
            const arrayBuffer = await blob.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const actualMd5 = await computeMd5(data);

            console.log(`${url}: got md5:       ${actualMd5}`);
            console.log(`${url}: expecting md5: ${expectedMd5}`);
            if (!expectedMd5 || actualMd5 === expectedMd5) {
                console.log(`${url}: checksum ok`);
                console.log(`${url}: storing blob in cache`);
                await destinationCache.put(url, new Response(blob, { status, statusText, headers }));
                console.log(`${url}: stored!`);
            } else {
                console.log(`${url}: checksum failed!`);
                throw new Error(`${url}: checksum failed, expected ${expectedMd5}, got ${actualMd5}`);
            }
        }

        // Check if a given url is already present in the cache, and optionally verify its MD5 checksum.
        async function existsInCache(url: string, destinationCache: Cache, expectedMd5: string | undefined) {
            let cachedResponse = await destinationCache.match(url);
            if (!cachedResponse) {
                return false;
            }
            console.log(`${url}: exists in cache`);
            if (!expectedMd5) {
                console.log(`${url}: no expected checksum, accepting the cached file`);
                return true;
            }
            console.log(`${url}: comparing checksums...`);
            const arrayBuffer = await cachedResponse.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const BYPASS_CHECKSUM = true; // currently, it takes a long time to compute the checksum for cached files
            if (BYPASS_CHECKSUM) {
                console.log(`${url}: bypassing checksum accepting the cached file`);
                return true;
            }
            const actualMd5 = await computeMd5(data);
            if (actualMd5 === expectedMd5) {
                console.log(`${url}: checksums match, accepting the cached file`);
                return true;
            }
            console.log(`${url}: checksums do not match, re-downloading`);
            return false;
        }

        const downloadFilesSequentially = async () => {
            const promises = [];
            for (let i = 0; i < files.length; i++) {
                const { url, destinationCache, expectedMd5 } = files[i];

                // First, check if we already have this file cached.
                let skip = await existsInCache(url, destinationCache, expectedMd5);
                if (skip) continue;

                // Start the download for a new file.
                console.log(`Starting download for file ${i + 1}/${files.length}: ${files[i].url}`);
                const downloadResult = await downloadFile(url);

                // The following can take a couple of seconds, we let the promise run while
                // we loop and start another download.
                const promise = storeInCache(downloadResult, url, destinationCache, expectedMd5);
                promises.push(promise);
            }

            // Make sure all download are stored in the cache.
            await Promise.all(promises);
        };

        // Start downloading files
        await downloadFilesSequentially();
    }

    private async mlcDownloadAndLoadToGpu(callback?: (progress: number, done: boolean) => void) {
        let variant = 'Mistral-7B-Instruct-v0.2-q4f16_1';
        try {
            await this.downloadModel(variant);
            if (!this.chat) {
                let worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
                this.chat = new WebWorkerEngine(worker);
            }
        } catch (e) {
            console.error(e);
            return;
        }

        this.chat.setInitProgressCallback((report: InitProgressReport) => {
            const done = report.progress === 1;
            if (report.progress == 1) {
                this.status = 'loading';
            }
            if (callback) {
                void callback(report.progress, done);
            }
        });

        const chatOpts = {};

        this.status = 'downloading';
        try {
            console.log(mlcConfig);
            const matchedItem = mlcConfig?.model_list.find((item) => item.model_id == variant);
            console.log(matchedItem);
            const modelRecord = matchedItem!;
            let modelUrl = modelRecord.model_url;
            if (!modelUrl.startsWith('http')) {
                const baseUrl = typeof document !== 'undefined' ? document.URL : globalThis.location.origin;
                modelUrl = new URL(modelUrl, baseUrl).href;
            }
            const wasmUrl = modelRecord.model_lib_url;
            console.log(wasmUrl);
            await this.chat.reload(variant, chatOpts, mlcConfig);
            this.model = new GpuLlmModel(this.chat, this);
            this.status = 'loaded';
        } catch (e) {
            console.error(e);
            this.status = 'error';
            throw e;
        }
    }

    cancelDownload(): boolean {
        throw Error('todo');
    }

    async loadOnGpu(): Promise<LlmModel> {
        if (this.status === undefined) {
            throw Error('model is not downloaded, run startDownload() first');
        }
        if (this.status === 'downloading') {
            throw Error('model is downloading, try again after download is complete');
        }
        if (this.status === 'unloaded') {
            // MLC will skip the download and go straight to loading on GPU
            await this.mlcDownloadAndLoadToGpu();
            // @ts-ignore: TS does not see that the line above will modify `this.status`
            if (this.status !== 'loaded') {
                throw Error('error while waiting for model to load on GPU');
            }
        }
        if (this.status === 'loading') {
            // wait for the model to be loaded
            while (true) {
                await delay(500);
                if (this.status !== 'loading') {
                    break;
                }
            }
            if (this.status !== 'loaded') {
                throw Error('error while waiting for model to load on GPU');
            }
        }
        if (this.status === 'loaded') {
            return this.model!;
        }
        throw Error('error while loading the model on GPU');
    }

    unload() {
        this.status = 'unloaded';
        this.model = undefined;
    }
}
