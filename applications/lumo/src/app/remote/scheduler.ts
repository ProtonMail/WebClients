export type Priority = 'urgent' | 'background';

interface QueueEntry<T> {
    fn: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
}

export class RequestScheduler {
    private active = 0;
    private urgentQueue: QueueEntry<any>[] = [];
    private backgroundQueue: QueueEntry<any>[] = [];

    constructor(private maxConcurrent: number) {}

    schedule<T>(fn: () => Promise<T>, priority: Priority): Promise<T> {
        return new Promise((resolve, reject) => {
            const entry: QueueEntry<T> = { fn, resolve, reject };
            const queue = priority === 'urgent' ? this.urgentQueue : this.backgroundQueue;
            queue.push(entry);
            this.runNext();
        });
    }

    private runNext() {
        while (this.active < this.maxConcurrent) {
            const entry = this.urgentQueue.shift() || this.backgroundQueue.shift();
            if (!entry) break;

            this.active++;
            entry
                .fn()
                .then((r) => entry.resolve(r))
                .catch((e) => entry.reject(e))
                .finally(() => {
                    this.active--;
                    this.runNext();
                });
        }
    }
}
