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

function getRandomLetter(): string {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
}

function generateRandomWord(): string {
    const length = getRandomNumber(3, 10);
    return Array.from({ length }, () => getRandomLetter()).join('');
}

function generateRandomSentence(nWords?: number): string[] {
    if (nWords === undefined) {
        nWords = getRandomNumber(50, 200);
    }

    const words = [];

    for (let i = 0; i < nWords; i++) {
        const word = generateRandomWord();
        words.push(word);
    }

    return words;
}

class DummyRunningActionBase implements RunningAction {
    protected running: boolean;

    protected done: boolean;

    protected cancelled: boolean;

    protected action_: Action;

    protected finishedPromise: Promise<void>;

    protected finishedPromiseSignals: { resolve: PromiseResolve; reject: PromiseReject } | undefined;

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

    constructor(action: Action) {
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
        this.finishedPromise = new Promise<void>((resolve: PromiseResolve, reject: PromiseReject) => {
            this.finishedPromiseSignals = { resolve, reject };
        });
    }
}

export class DummyWriteFullEmailRunningAction extends DummyRunningActionBase {
    constructor(action: WriteFullEmailAction, callback: GenerationCallback) {
        super(action);
        void this.startGeneration(action, callback);
    }

    private async startGeneration(action: WriteFullEmailAction, callback: GenerationCallback) {
        try {
            this.running = true;
            const words = generateRandomSentence();
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
}

export class DummyShortenRunningAction extends DummyRunningActionBase {
    constructor(action: ShortenAction, callback: GenerationCallback) {
        super(action);
        void this.startGeneration(action, callback);
    }

    protected async startGeneration(action: ShortenAction, callback: GenerationCallback) {
        try {
            this.running = true;
            const nWordsInput = action.partToRephase.split(/\W/).length;
            const nWordsOutput = nWordsInput > 10 ? nWordsInput / 2 : nWordsInput;
            const words = generateRandomSentence(nWordsOutput);
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
