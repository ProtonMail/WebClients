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

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
}

function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class DummyWriteFullEmailRunningAction implements RunningAction {
    private running: boolean;

    private done: boolean;

    private cancelled: boolean;

    private action_: WriteFullEmailAction;

    private finishedPromise: Promise<void>;

    private finishedPromiseSignals: { resolve: PromiseResolve; reject: PromiseReject } | undefined;

    constructor(action: WriteFullEmailAction, callback: GenerationCallback) {
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
        this.finishedPromise = new Promise<void>((resolve: PromiseResolve, reject: PromiseReject) => {
            this.finishedPromiseSignals = { resolve, reject };
        });

        void this.startGeneration(action, callback);
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
        if (!this.running) {
            return false;
        }
        this.running = false;
        this.cancelled = true;
        return true;
    }

    waitForCompletion(): Promise<void> {
        return this.finishedPromise;
    }

    private async startGeneration(action: WriteFullEmailAction, callback: GenerationCallback) {
        try {
            this.running = true;
            const words = this.generateRandomSentence();
            let fulltext = '';
            await delay(5000);
            for (let i = 0; i < words.length && this.running; i++) {
                await delay(150);
                let word = words[i] + ' ';
                fulltext += word;
                callback(word, fulltext);
            }
            this.done = true;
            this.running = false;
        } catch (e) {
            this.running = false;
            this.finishedPromiseSignals?.reject();
            return;
        }
        this.finishedPromiseSignals?.resolve();
    }

    private generateRandomSentence(): string[] {
        const wordCount = getRandomNumber(50, 200);
        const words = [];

        for (let i = 0; i < wordCount; i++) {
            const word = this.generateRandomWord();
            words.push(word);
        }

        return words;
    }

    private generateRandomWord(): string {
        const length = getRandomNumber(3, 10);
        return Array.from({ length }, () => this.getRandomLetter()).join('');
    }

    private getRandomLetter(): string {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }
}

// todo deduplicate common code
export class DummyShortenRunningAction implements RunningAction {
    private running: boolean;

    private done: boolean;

    private cancelled: boolean;

    private action_: ShortenAction;

    private finishedPromise: Promise<void>;

    private finishedPromiseSignals: { resolve: PromiseResolve; reject: PromiseReject } | undefined;

    constructor(action: ShortenAction, callback: GenerationCallback) {
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
        this.finishedPromise = new Promise<void>((resolve: PromiseResolve, reject: PromiseReject) => {
            this.finishedPromiseSignals = { resolve, reject };
        });

        void this.startGeneration(action, callback);
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
        if (!this.running) {
            return false;
        }
        this.running = false;
        this.cancelled = true;
        return true;
    }

    waitForCompletion(): Promise<void> {
        return this.finishedPromise;
    }

    private async startGeneration(action: ShortenAction, callback: GenerationCallback) {
        try {
            this.running = true;
            const nWordsInput = action.partToRephase.split(/\W/).length;
            const nWordsOutput = nWordsInput > 10 ? nWordsInput / 2 : nWordsInput;
            const words = this.generateRandomSentence(nWordsOutput);
            let fulltext = '';
            await delay(5000);
            for (let i = 0; i < words.length && this.running; i++) {
                await delay(150);
                let word = words[i] + ' ';
                fulltext += word;
                callback(word, fulltext);
            }
            this.done = true;
            this.running = false;
        } catch (e) {
            this.running = false;
            this.finishedPromiseSignals?.reject();
            return;
        }
        this.finishedPromiseSignals?.resolve();
    }

    // todo extract to standalone functions
    private generateRandomSentence(nWords?: number): string[] {
        if (nWords === undefined) {
            nWords = getRandomNumber(50, 200);
        }

        const words = [];

        for (let i = 0; i < nWords; i++) {
            const word = this.generateRandomWord();
            words.push(word);
        }

        return words;
    }

    private generateRandomWord(): string {
        const length = getRandomNumber(3, 10);
        return Array.from({ length }, () => this.getRandomLetter()).join('');
    }

    private getRandomLetter(): string {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }
}

export class DummyLlmModel implements LlmModel {
    async unload(): Promise<void> {
        await delay(1500);
    }

    async performAction(action: Action, callback: GenerationCallback): Promise<RunningAction> {
        switch (action.type) {
            case 'writeFullEmail':
                return new DummyWriteFullEmailRunningAction(action, callback);
            case 'shorten': {
                return new DummyShortenRunningAction(action, callback);
            }
            default:
                throw Error('unimplemented');
        }
    }
}

// @ts-ignore
export class DummyLlmManager implements LlmManager {
    private TOTAL_CHUNKS = 50;

    private downloadedChunks: number;

    private downloading: boolean;

    constructor() {
        this.downloading = false;
        this.downloadedChunks = 0;
    }

    hasGpu(): boolean {
        return true;
    }

    isDownloading(): boolean {
        return this.downloading;
    }

    async startDownload(callback: MonitorDownloadCallback): Promise<void> {
        void (async () => {
            this.downloading = this.downloadedChunks < this.TOTAL_CHUNKS;
            while (this.downloading) {
                const progress = this.downloadedChunks / this.TOTAL_CHUNKS;
                const done = this.downloadedChunks === this.TOTAL_CHUNKS;
                this.downloading = !done;
                callback(progress, done);
                if (done) break;
                if (!done) {
                    await delay(400);
                    this.downloadedChunks++;
                }
            }
            this.downloading = false;
        })();
    }

    cancelDownload(): boolean {
        const cancelled = this.downloading;
        this.downloading = false;
        return cancelled;
    }

    async loadOnGpu(): Promise<LlmModel> {
        await delay(10000);
        return new DummyLlmModel();
    }
}
