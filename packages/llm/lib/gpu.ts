import '@mlc-ai/web-llm';
import { WebWorkerEngine } from '@mlc-ai/web-llm';

import { downloadModel } from '@proton/llm/lib/downloader';
import { BaseRunningAction } from '@proton/llm/lib/runningAction';

import mlcConfig from './mlc-config';
import type {
    Action,
    DownloadProgressCallback,
    GenerationCallback,
    LlmManager,
    LlmModel,
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

    async startDownload(updateProgress: DownloadProgressCallback): Promise<void> {
        this.status = 'downloading';
        await downloadModel(MODEL_VARIANT, updateProgress);
        this.status = 'unloaded';
    }

    private async startMlcEngine() {
        try {
            // Create Web-LLM worker
            if (!this.chat) {
                let worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
                this.chat = new WebWorkerEngine(worker);
            }

            // Call `reload` on the engine. If all the files are in place,
            // this should go straight to loading the model on GPU without downloading.
            this.status = 'loading';
            const chatOpts = {};
            await this.chat.reload(MODEL_VARIANT, chatOpts, mlcConfig);
            this.model = new GpuLlmModel(this.chat, this);
            this.status = 'loaded';
        } catch (e) {
            /* eslint-disable-next-line no-console */
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
            await this.startMlcEngine();
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
