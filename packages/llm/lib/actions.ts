import '@mlc-ai/web-llm';
import type { ChatOptions } from '@mlc-ai/web-llm';
import { WebWorkerEngine } from '@mlc-ai/web-llm';

import type { ServerAssistantInteraction, TransformCallback } from '@proton/llm/lib/formatPrompt';
import {
    expandActionToCustomRefineAction,
    formalActionToCustomRefineAction,
    formatPromptCustomRefine,
    formatPromptExpand,
    formatPromptFormal,
    formatPromptFriendly,
    formatPromptProofread,
    formatPromptShorten,
    formatPromptWriteFullEmail,
    friendlyActionToCustomRefineAction,
    getCustomStopStringsForAction,
    makeRefineCleanup,
    proofreadActionToCustomRefineAction,
} from '@proton/llm/lib/formatPrompt';

import { CACHING_FAILED, GENERAL_STOP_STRINGS, IFRAME_COMMUNICATION_TIMEOUT } from './constants';
import type { AppCaches, CacheId } from './downloader';
import { getCachedFiles, storeInCache } from './downloader';
import { isAssistantPostMessage, makeTransformWriteFullEmail, postMessageParentToIframe } from './helpers';
import { BaseRunningAction } from './runningAction';
import type {
    Action,
    AssistantConfig,
    CustomRefineAction,
    DownloadProgressCallback,
    ExpandAction,
    FormalAction,
    FriendlyAction,
    GenerationCallback,
    GenerationCallbackDetails,
    LlmManager,
    LlmModel,
    ProofreadAction,
    RunningAction,
    ShortenAction,
    WriteFullEmailAction,
} from './types';
import { AssistantEvent } from './types';

const MODEL_VARIANT = 'Mistral-7B-Instruct-v0.2-q4f16_1';

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
}

export class GpuWriteFullEmailRunningAction extends BaseRunningAction {
    constructor(action: WriteFullEmailAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPromptWriteFullEmail(action);
        super(prompt, callback, chat, action);
    }
}

export class GpuShortenRunningAction extends BaseRunningAction {
    constructor(action: ShortenAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPromptShorten(action);
        super(prompt, callback, chat, action);
    }
}

export class GpuRefineRunningAction extends BaseRunningAction {
    constructor(action: CustomRefineAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPromptCustomRefine(action);
        const refineCleanup = makeRefineCleanup(action);
        const wrappedCallback: GenerationCallback = (fulltext: string, details?: GenerationCallbackDetails) => {
            let cleaned = refineCleanup(fulltext);
            return callback(cleaned || '', details);
        };
        super(prompt, wrappedCallback, chat, action, ['</span>', '</div>']);
    }
}

export class GpuProofreadRunningAction extends GpuRefineRunningAction {
    constructor(action: ProofreadAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = proofreadActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
    }
}

export class GpuFormalRunningAction extends GpuRefineRunningAction {
    constructor(action: FormalAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = formalActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
    }
}

export class GpuFriendlyRunningAction extends GpuRefineRunningAction {
    constructor(action: FriendlyAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = friendlyActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
    }
}

export class GpuExpandRunningAction extends GpuRefineRunningAction {
    constructor(action: ExpandAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = expandActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
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
            case 'proofread':
                return new GpuProofreadRunningAction(action, this.chat, callback);
            case 'formal':
                return new GpuFormalRunningAction(action, this.chat, callback);
            case 'friendly':
                return new GpuFriendlyRunningAction(action, this.chat, callback);
            case 'expand':
                return new GpuExpandRunningAction(action, this.chat, callback);
            case 'customRefine':
                return new GpuRefineRunningAction(action, this.chat, callback);
            default:
                throw Error('unimplemented');
        }
    }
}

export class GpuLlmManager implements LlmManager {
    private chat: WebWorkerEngine | undefined;

    private status: undefined | 'downloading' | 'loading' | 'loaded' | 'unloaded' | 'error';

    private model: GpuLlmModel | undefined; // defined if status === 'loaded'

    constructor() {
        this.chat = undefined;
        this.status = undefined;
    }

    isDownloading(): boolean {
        return this.status === 'downloading';
    }

    async isDownloaded(assistantConfig: AssistantConfig, setLlmStatus = true): Promise<boolean> {
        const modelVariant = assistantConfig.model_list[0].model_id;

        const { needsAdditionalDownload } = await getCachedFiles(modelVariant, assistantConfig);

        if (!needsAdditionalDownload && setLlmStatus) {
            this.status = 'unloaded';
        }

        return !needsAdditionalDownload;
    }

    async startDownload(updateProgress: DownloadProgressCallback, assistantConfig: AssistantConfig): Promise<boolean> {
        this.status = 'downloading';
        const promises: Promise<void>[] = [];
        let appCaches: AppCaches;
        let downloadPromiseResolve: (value: boolean | PromiseLike<boolean>) => void;
        let downloadPromiseReject: (reason?: any) => void;
        let pingIframeTimeout: ReturnType<typeof setTimeout> | undefined;
        const modelVariant = assistantConfig.model_list[0].model_id;

        const handleReceived = async (event: MessageEvent) => {
            if (!isAssistantPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case AssistantEvent.IFRAME_READY:
                    {
                        // Clear timeout if we received an event from the iframe
                        if (pingIframeTimeout) {
                            clearTimeout(pingIframeTimeout);
                        }
                    }
                    break;
                case AssistantEvent.DOWNLOAD_PROGRESS:
                    {
                        // Call the download callback when receiving progress updates
                        const { progress } = event.data.payload;
                        updateProgress(progress);
                    }
                    break;
                case AssistantEvent.DOWNLOAD_DATA:
                    {
                        // Get downloaded data from the iframe and store it in the cache
                        const { downloadResult, cacheUrl, cacheId, expectedMd5, terminate } = event.data.payload;

                        if (appCaches) {
                            const destinationCache = appCaches[cacheId as CacheId];
                            const promise = storeInCache(downloadResult, cacheUrl, destinationCache, expectedMd5).catch(
                                (e) => {
                                    // Reject the download promise in case the caching fails
                                    // This usually happens when user is on private mode, where there is a caching limit
                                    console.error(e);
                                    this.status = 'error';
                                    void this.chat?.unload?.();
                                    const error = new Error(CACHING_FAILED);
                                    downloadPromiseReject(error);
                                }
                            );
                            promises.push(promise);

                            // Resolve the promise when receiving the last file
                            if (terminate) {
                                this.status = 'unloaded';
                                await Promise.all(promises);

                                // The quota exceeded error is not always triggered time when the user is on private mode.
                                // So before resolving the promise, we're checking that all needed files are cached
                                // In case they're not, we need to show an error
                                const { needsAdditionalDownload } = await getCachedFiles(modelVariant, assistantConfig);
                                if (needsAdditionalDownload) {
                                    const error = new Error(CACHING_FAILED);
                                    console.error(error);
                                    this.status = 'error';
                                    downloadPromiseReject(error);
                                } else {
                                    downloadPromiseResolve(true);
                                }
                            }
                        }
                    }
                    break;
                case AssistantEvent.DOWNLOAD_ERROR:
                    {
                        const { error } = event.data.payload;

                        if (typeof error === 'object' && error.name === 'AbortError') {
                            // user aborted, and it was successful
                            this.status = undefined;
                            downloadPromiseResolve(false);
                        } else {
                            console.error(error);
                            this.status = 'error';
                            downloadPromiseReject(error);
                        }
                    }
                    break;
            }
        };

        // Creating a promise so that we can wait for the entire downloading process to be complete on the iframe side before
        // ending this function.
        const downloadPromise = await new Promise<boolean>(async (resolve, reject) => {
            downloadPromiseResolve = resolve;
            downloadPromiseReject = reject;
            try {
                // Search for files already present in the cache, download the ones that are not downloaded yet
                const {
                    filesAlreadyDownloaded,
                    needsAdditionalDownload,
                    appCaches: currentAppCaches,
                } = await getCachedFiles(modelVariant, assistantConfig);

                appCaches = currentAppCaches;

                // Post message to the iframe if we need to download some files
                if (needsAdditionalDownload) {
                    window.addEventListener('message', handleReceived);

                    postMessageParentToIframe({
                        type: AssistantEvent.START_DOWNLOAD,
                        payload: {
                            config: assistantConfig,
                            modelVariant,
                            filesToIgnore: filesAlreadyDownloaded,
                        },
                    });

                    // Set a timeout that will reject the promise in case the communication with the iframe fails
                    pingIframeTimeout = setTimeout(() => {
                        reject(new Error('Assistant iframe request timeout'));
                    }, IFRAME_COMMUNICATION_TIMEOUT);
                }

                // Resolve the promise if all files are already cached
                if (!needsAdditionalDownload) {
                    this.status = 'unloaded';
                    await Promise.all(promises);
                    resolve(true);
                }
            } catch (e: any) {
                console.error(e);
                this.status = 'error';
                reject(e);
            }
        }).finally(() => {
            window.removeEventListener('message', handleReceived);
        });

        return downloadPromise;
    }

    private async startMlcEngine(assistantConfig: AssistantConfig) {
        try {
            // Create Web-LLM worker
            if (!this.chat) {
                let worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
                this.chat = new WebWorkerEngine(worker);
            }

            // Call `reload` on the engine. If all the files are in place,
            // this should go straight to loading the model on GPU without downloading.
            this.status = 'loading';
            const chatOpts: ChatOptions = {
                conv_template: 'empty',
                conv_config: {
                    stop_str: GENERAL_STOP_STRINGS,
                    stop_token_ids: [2],
                    role_empty_sep: ' ',
                },
            };
            await this.chat.reload(MODEL_VARIANT, chatOpts, assistantConfig);
            this.model = new GpuLlmModel(this.chat, this);
            this.status = 'loaded';
        } catch (e) {
            // todo: check if the error is about webgpu, and throw a more specific error in this case
            /* eslint-disable-next-line no-console */
            console.error(e);
            this.status = 'error';
            throw e;
        }
    }

    cancelDownload() {
        postMessageParentToIframe({
            type: AssistantEvent.PAUSE_DOWNLOAD,
        });
    }

    async loadOnGpu(assistantConfig: AssistantConfig): Promise<LlmModel> {
        if (this.status === undefined) {
            throw Error('model is not downloaded, run startDownload() first');
        }
        if (this.status === 'downloading') {
            throw Error('model is downloading, try again after download is complete');
        }
        if (this.status === 'unloaded') {
            // MLC will skip the download and go straight to loading on GPU
            await this.startMlcEngine(assistantConfig);
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

export function getPromptForAction(action: Action) {
    switch (action.type) {
        case 'writeFullEmail':
            return formatPromptWriteFullEmail(action);
        case 'shorten':
            return formatPromptShorten(action);
        case 'proofread':
            return formatPromptProofread(action);
        case 'friendly':
            return formatPromptFriendly(action);
        case 'formal':
            return formatPromptFormal(action);
        case 'expand':
            return formatPromptExpand(action);
        case 'customRefine':
            return formatPromptCustomRefine(action);
        default:
            throw Error('unimplemented');
    }
}

export function getTransformForAction(action: Action): TransformCallback {
    switch (action.type) {
        case 'writeFullEmail':
            return makeTransformWriteFullEmail(action.sender);
        default:
            return makeRefineCleanup(action);
    }
}

export function prepareServerAssistantInteraction(action: Action): ServerAssistantInteraction {
    const rawLlmPrompt = getPromptForAction(action);
    const transformCallback = getTransformForAction(action);
    const customStopStrings = getCustomStopStringsForAction(action);
    const baseStopStrings = [...GENERAL_STOP_STRINGS, ...customStopStrings];

    // HACK: Llama.cpp has a bug which does not handle well the stop-string "```".
    // Consequently, we're not supplying this stop-string to llama.cpp. Note it will
    // still be used locally in makeRefineCleanup, such that all text we receive
    // after this stop-string is still ignored locally.
    const STOPSTRINGS_DISABLED_ON_SERVER = ['```'];
    const stopStrings = baseStopStrings.filter((stopString) => !STOPSTRINGS_DISABLED_ON_SERVER.includes(stopString));

    return {
        rawLlmPrompt,
        transformCallback,
        stopStrings,
    };
}
