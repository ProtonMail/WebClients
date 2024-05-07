import '@mlc-ai/web-llm';
import { ChatOptions, WebWorkerEngine } from '@mlc-ai/web-llm';

import { downloadModel } from '@proton/llm/lib/downloader';
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
        const fullEmail = `${pre}<span class="to-modify">${mid}</span>${end}`;
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

    private model: GpuLlmModel | undefined; // defined iff status === 'loaded'

    private abortController: AbortController | undefined; // defined iff status === 'loading'

    constructor() {
        this.chat = undefined;
        this.status = undefined;
        this.abortController = undefined;
    }

    isDownloading(): boolean {
        return this.status === 'downloading';
    }

    async startDownload(updateProgress: DownloadProgressCallback, assistantConfig: AssistantConfig): Promise<boolean> {
        this.status = 'downloading';
        this.abortController = new AbortController();
        try {
            await downloadModel(MODEL_VARIANT, updateProgress, assistantConfig, this.abortController);
            this.status = 'unloaded';
            return true;
        } catch (e: any) {
            if (typeof e === 'object' && e.name === 'AbortError') {
                // user aborted, and it was successful
                this.status = undefined;
                return false;
            } else {
                console.error(e);
                this.status = 'error';
                throw e;
            }
        } finally {
            this.abortController = undefined;
        }
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

    // Request to cancel an ongoing download. Returns whether there was a download in progress
    // that we did request to abort.
    //
    // This will return immediately, but the cancellation will be complete when the startDownload() promise is
    // resolved, which shouldn't take long.
    cancelDownload(): boolean {
        if (this.abortController) {
            this.abortController.abort();
            return true;
        } else {
            return false;
        }
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
