import '@mlc-ai/web-llm';
import type { InitProgressReport } from '@mlc-ai/web-llm';
import { WebWorkerEngine } from '@mlc-ai/web-llm';

import mlcConfig from './mlc-config';
import type {
    Action,
    GenerationCallback,
    LlmManager,
    LlmModel,
    MonitorDownloadCallback,
    PromiseReject,
    PromiseResolve,
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

export class GpuWriteFullEmailRunningAction implements RunningAction {
    private chat: WebWorkerEngine;

    private action_: WriteFullEmailAction;

    private running: boolean;

    private done: boolean;

    private cancelled: boolean;

    private finishedPromise: Promise<void>;

    private finishedPromiseSignals: { resolve: PromiseResolve; reject: PromiseReject } | undefined;

    // @ts-ignore
    private generation: Promise<void>;

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

        let fulltext = '';
        const generateProgressCallback = (_step: number, message: string) => {
            const token = message.slice(fulltext.length);
            fulltext = message;
            callback(token, fulltext);
        };

        this.finishedPromise = new Promise<void>((resolve: PromiseResolve, reject: PromiseReject) => {
            this.finishedPromiseSignals = { resolve, reject };
        });

        this.generation = chat
            .generate(prompt, generateProgressCallback)
            .then(() => {
                this.finishedPromiseSignals!.resolve();
            })
            .catch(() => {
                this.done = true;
                this.finishedPromiseSignals!.reject();
                this.done = true;
            })
            .finally(() => {
                this.running = false;
            });
        this.chat = chat;
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
    }

    isRunning(): boolean {
        return this.running;
    }

    isDone(): boolean {
        return this.done;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    action(): Action {
        return this.action_;
    }

    cancel(): boolean {
        if (this.running) {
            this.chat.interruptGenerate();
            this.running = false;
            this.done = false;
            this.cancelled = true;
            return true;
        }
        return false;
    }

    waitForCompletion(): Promise<void> {
        return this.finishedPromise;
    }
}

export class GpuShortenRunningAction implements RunningAction {
    private chat: WebWorkerEngine;

    private action_: ShortenAction;

    private running: boolean;

    private done: boolean;

    private cancelled: boolean;

    private finishedPromise: Promise<void>;

    private finishedPromiseSignals: { resolve: PromiseResolve; reject: PromiseReject } | undefined;

    // @ts-ignore
    private generation: Promise<void>;

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

        let fulltext = '';
        const generateProgressCallback = (_step: number, message: string) => {
            const token = message.slice(fulltext.length);
            fulltext = message;
            callback(token, fulltext);
        };

        this.finishedPromise = new Promise<void>((resolve: PromiseResolve, reject: PromiseReject) => {
            this.finishedPromiseSignals = { resolve, reject };
        });

        this.generation = chat
            .generate(prompt, generateProgressCallback)
            .then(() => {
                this.finishedPromiseSignals!.resolve();
            })
            .catch(() => {
                this.done = true;
                this.finishedPromiseSignals!.reject();
                this.done = true;
            })
            .finally(() => {
                this.running = false;
            });
        this.chat = chat;
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
    }

    isRunning(): boolean {
        return this.running;
    }

    isDone(): boolean {
        return this.done;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    action(): Action {
        return this.action_;
    }

    cancel(): boolean {
        if (this.running) {
            this.chat.interruptGenerate();
            this.running = false;
            this.done = false;
            this.cancelled = true;
            return true;
        }
        return false;
    }

    waitForCompletion(): Promise<void> {
        return this.finishedPromise;
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
            default:
                throw Error('unimplemented');
        }
    }
}

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

    private async mlcDownloadAndLoadToGpu(callback?: (progress: number, done: boolean) => void) {
        if (!this.chat) {
            let worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
            this.chat = new WebWorkerEngine(worker);
        }

        // The "selfhost" variant below would download the weights from our assets dir (see public/assets/ml-models)
        // let variant = 'Mistral-7B-Instruct-v0.2-q4f16_1-selfhost';
        let variant = 'Mistral-7B-Instruct-v0.2-q4f16_1';

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
            await this.chat.reload(variant, chatOpts, mlcConfig);
            this.model = new GpuLlmModel(this.chat, this);
            this.status = 'loaded';
        } catch (e) {
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
