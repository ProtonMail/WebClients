export class BatchQueue<T> {
    private batchSize: number;
    private flushCallback: undefined | ((items: T[]) => void);
    private flushIntervalMs: number;
    private queue: T[] = [];
    private timeout: ReturnType<typeof setTimeout> | null = null;

    constructor({
        batchSize,
        flushCallback,
        flushIntervalMs,
    }: {
        batchSize?: number;
        flushCallback?: (items: T[]) => void;
        flushIntervalMs?: number;
    } = {}) {
        this.batchSize = batchSize ?? 100;
        this.flushCallback = flushCallback ?? undefined;
        this.flushIntervalMs = flushIntervalMs ?? 30 * 1000;
        this.timeout = null;
    }

    public setBatchSize(batchSize: number) {
        this.batchSize = batchSize;
    }

    public setFlushIntervalMs(flushIntervalMs: number) {
        this.flushIntervalMs = flushIntervalMs;
    }

    public setFlushCallback(callback: (items: T[]) => void) {
        this.flushCallback = callback;
    }

    public hasFlushCallback() {
        return Boolean(this.flushCallback && typeof this.flushCallback === 'function');
    }

    public clear() {
        this.queue = [];
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    public add(item: T) {
        this.queue.push(item);

        if (this.queue.length >= this.batchSize) {
            this.flush();
            return;
        }

        if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.flush();
            }, this.flushIntervalMs);
        }
    }

    public flush() {
        if (typeof this.flushCallback === 'function') {
            this.flushCallback([...this.queue]);
        }
        this.clear();
    }
}
