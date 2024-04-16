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
    WriteFullEmailAction,
} from './types';

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
}

export class GpuWriteFullEmailRunningAction implements RunningAction {
    static INSTRUCTIONS = [
        'You write email messages according to the description provided by the user.',
        'You do not use emojis.',
        'There should be no subject, directly write the body of the message.',
        'The signature at the end should stop after the closing salutation.',
    ].join(' ');

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
        const userPrompt = action.prompt
            .trim()
            .replaceAll(/(<\|[^>]*\|>)/g, '') // remove <|...|> markers
            .replaceAll(/(<\||\|>)/g, ''); // remove <| and |>
        const prompt = [
            '<|instructions|>\n',
            GpuWriteFullEmailRunningAction.INSTRUCTIONS,
            '\n\n',
            '<|user|>\n',
            userPrompt,
            '\n\n',
            '<|assistant|>\n',
            'Body:\n\n',
        ].join('');

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
