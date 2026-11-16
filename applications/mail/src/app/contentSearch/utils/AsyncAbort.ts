export class AsyncAbort {
    private handler: ((evt: Event) => void) | undefined;
    public readonly promise: Promise<never>;

    constructor(private readonly abortSignals: AbortSignal[]) {
        this.promise = new Promise<never>((_, reject) => {
            const alreadyAborted = this.abortSignals.find((s) => s.aborted);
            if (alreadyAborted) {
                reject(alreadyAborted.reason);
            } else {
                this.handler = (evt: Event) => reject((evt.target as AbortSignal).reason);
                for (const s of this.abortSignals) {
                    s.addEventListener('abort', this.handler);
                }
            }
        });
    }

    dispose() {
        if (this.handler) {
            for (const s of this.abortSignals) {
                s.removeEventListener('abort', this.handler);
            }
        }
    }
}

export function isAbortedFrom(err: unknown, abortSignal: AbortSignal) {
    return abortSignal.aborted && abortSignal.reason === err;
}
