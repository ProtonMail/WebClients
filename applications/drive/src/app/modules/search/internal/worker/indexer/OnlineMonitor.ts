import { Logger } from '../../shared/Logger';

/**
 * Tracks connectivity for the indexer task queue and freezes processing while
 * the worker scope reports offline (navigator.onLine + 'online'/'offline' events).
 *
 * TODO: this only reacts to navigator-level connectivity. If the SDK throws
 * OfflineError / ConnectionError while navigator.onLine is still true, the queue
 * won't freeze - it'll just keep retrying with backoff. Revisit if we see
 * stuck-online scenarios in the wild.
 */
export class OnlineMonitor {
    private isOnlineState: boolean;
    private offlinePromise: Promise<void> | null = null;
    private resolveOffline: (() => void) | null = null;

    constructor() {
        this.isOnlineState = typeof navigator === 'undefined' ? true : navigator.onLine;
        if (!this.isOnlineState) {
            Logger.info('OnlineMonitor: starting offline (navigator.onLine === false)');
        }

        if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
            self.addEventListener('online', () => this.setOnline(true));
            self.addEventListener('offline', () => this.setOnline(false));
        }
    }

    isOnline(): boolean {
        return this.isOnlineState;
    }

    /**
     * Resolves when online. Returns immediately if already online.
     */
    waitForOnline(): Promise<void> {
        if (this.isOnlineState) {
            return Promise.resolve();
        }
        if (!this.offlinePromise) {
            this.offlinePromise = new Promise<void>((resolve) => {
                this.resolveOffline = resolve;
            });
        }
        return this.offlinePromise;
    }

    /**
     * Releases all pending `waitForOnline` callers without changing the
     * online state.
     */
    cancelWaits(): void {
        this.releaseOfflinePromise();
    }

    private setOnline(value: boolean): void {
        if (value === this.isOnlineState) {
            return;
        }
        this.isOnlineState = value;
        Logger.info(`OnlineMonitor: ${value ? 'online' : 'offline'}`);
        if (value) {
            this.releaseOfflinePromise();
        }
    }

    private releaseOfflinePromise(): void {
        const resolve = this.resolveOffline;
        this.offlinePromise = null;
        this.resolveOffline = null;
        resolve?.();
    }
}
