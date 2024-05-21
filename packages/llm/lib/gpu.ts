import '@mlc-ai/web-llm';
import { ChatOptions, WebWorkerEngine } from '@mlc-ai/web-llm';

import { AppCaches, getCachedFiles, getDestinationCacheFromID, storeInCache } from '@proton/llm/lib/downloader';
import { isAssistantPostMessage, postMessageToAssistantIframe } from '@proton/llm/lib/helpers';
import { BaseRunningAction } from '@proton/llm/lib/runningAction';

import type {
    Action,
    AssistantConfig,
    DownloadProgressCallback,
    GenerationCallback,
    LlmManager,
    LlmModel,
    RefineAction,
    RunningAction,
    ShortenAction,
    WriteFullEmailAction,
} from './types';
import { ASSISTANT_EVENTS } from './types';

const INSTRUCTIONS_WRITE_FULL_EMAIL = [
    "You're a harmless email generator.",
    "You're given a list of toxic content categories as below:",
    '- illegal',
    '- child abuse: child sexual abuse material or any content that exploits or harms children.',
    '- adult: adult content, adult industries, and dating apps.',
    '- malicious attachments/URLs or malware: including dangerous files, links or virus.',
    '- fraud: fraudulent or deceptive activity.',
    '- impersonation: impersonating others.',
    "- privacy invasion: requesting unnecessary personal information or activity that violates people's privacy.",
    '- political: political campaigning or lobbying.',
    '- phishing instructions: guidance on sharing sensitive information via email or links; ' +
        'promote secure data sharing methods.',
    '- spam: containing unwanted ads, promotional material or trying to sell products.',
    '- bomb threats',
    '- harassment or threats: intimidating, bullying, hateful, harassing, violent or derogatory messages.',
    '- inappropriate/offensive content: containing hate speech, sexual content, or objectionable material.',
    '- unverified content: misinformation, misleading information, unconfirmed claims or fake news.',
    '- false promises: unrealistic offers or guarantees.',
    'Please check if the description provided by the user falls within one of these categories.',
    'If the answer is yes, it\'s toxic and harmful, please answer "Harmful (yes/no): yes" and cease.',
    [
        'If the answer is no, please answer "Harmful (yes/no): no" and then start a complete email message with ' +
            '"Body:", following the user\'s request.',
        'You do not use emojis.',
        'There should be no subject, directly write the body of the message.',
        'You sign as "[Your Name]".',
        'Be mindful to direct the message to the recipient as indicated by the user.',
        'Who is the recipient? Write their name in the opening.',
    ].join(' '),
].join('\n');

const INSTRUCTIONS_WRITE_FULL_EMAIL_USER_PREFIX =
    'Turn the following sentence into a complete email, properly formatted:';

const HARMFUL_CHECK_PREFIX = 'Harmful (yes/no): ';

const INSTRUCTIONS_SHORTEN = [
    "Now, you shorten the part of the email that's in the the input below.",
    'Only summarize the part below and do not add anything else.',
].join(' ');

const INSTRUCTIONS_REFINE = [
    'The user wants to modify a part of the email identified by the span tags.',
    "If the user's request is unethical or harmful, you do not replace the part to modify.",
].join(' ');

const MODEL_VARIANT = 'Mistral-7B-Instruct-v0.2-q4f16_1';

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
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
                contents: `${INSTRUCTIONS_WRITE_FULL_EMAIL_USER_PREFIX}\n\n${action.prompt}`,
            },
            {
                role: 'assistant',
                contents: HARMFUL_CHECK_PREFIX,
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
                contents: action.partToRephrase,
            },
            {
                role: 'short_part',
            },
        ]);
        super(prompt, callback, chat, action);
    }
}

export class GpuRefineRunningAction extends BaseRunningAction {
    constructor(action: RefineAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const pre = action.fullEmail.slice(0, action.idxStart);
        const mid = action.fullEmail.slice(action.idxStart, action.idxEnd);
        const end = action.fullEmail.slice(action.idxEnd);
        const fullEmail = `${pre}<span class="to-modify"> ${mid}</span>${end}`;
        const newEmailStart = `${pre}<span class="modified">`;
        const prompt = formatPrompt([
            {
                role: 'email',
                contents: fullEmail,
            },
            {
                role: 'system',
                contents: INSTRUCTIONS_REFINE,
            },
            {
                role: 'user',
                contents: action.prompt,
            },
            {
                role: 'email',
                contents: newEmailStart,
            },
        ]);
        super(prompt, callback, chat, action, ['</span']);
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
            case 'refine':
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

    async startDownload(updateProgress: DownloadProgressCallback, assistantConfig: AssistantConfig): Promise<boolean> {
        this.status = 'downloading';
        const promises: Promise<void>[] = [];
        let appCaches: AppCaches;
        let downloadPromiseResolve: (value: boolean | PromiseLike<boolean>) => void;
        let downloadPromiseReject: (reason?: any) => void;

        const handleReceived = async (event: MessageEvent) => {
            if (!isAssistantPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case ASSISTANT_EVENTS.DOWNLOAD_PROGRESS:
                    {
                        // Call the download callback when receiving progress updates
                        const { progress } = event.data.payload;
                        updateProgress(progress);
                    }
                    break;
                case ASSISTANT_EVENTS.DOWNLOAD_DATA:
                    {
                        // Get downloaded data from the iframe and store it in the cache
                        const { downloadResult, url, destinationCacheID, expectedMd5, terminate } = event.data.payload;

                        if (appCaches) {
                            const destinationCache = getDestinationCacheFromID(destinationCacheID, appCaches);
                            if (destinationCache) {
                                const promise = storeInCache(downloadResult, url, destinationCache, expectedMd5);
                                promises.push(promise);
                            } else {
                                // throw an error?
                            }

                            // Resolve the promise when receiving the last file
                            if (terminate) {
                                this.status = 'unloaded';
                                await Promise.all(promises);
                                downloadPromiseResolve(true);
                            }
                        }
                    }
                    break;
                case ASSISTANT_EVENTS.DOWNLOAD_ERROR:
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
                const modelVariant = assistantConfig.model_list[0].model_id;
                const {
                    filesAlreadyDownloaded,
                    needsAdditionalDownload,
                    appCaches: currentAppCaches,
                } = await getCachedFiles(modelVariant, assistantConfig);

                appCaches = currentAppCaches;

                // Post message to the iframe if we need to download some files
                if (needsAdditionalDownload) {
                    window.addEventListener('message', handleReceived);

                    postMessageToAssistantIframe({
                        type: ASSISTANT_EVENTS.START_DOWNLOAD,
                        payload: {
                            config: assistantConfig,
                            modelVariant,
                            filesToIgnore: filesAlreadyDownloaded,
                        },
                    });
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
                    stop_str: ['</s>', '[INST]', '[/INST]'],
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
        postMessageToAssistantIframe({
            type: ASSISTANT_EVENTS.PAUSE_DOWNLOAD,
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
