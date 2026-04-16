import * as Comlink from 'comlink';

import { createAsyncQueue } from '../../../../utils/asyncQueue';
import { Logger } from '../shared/Logger';
import { registerComlinkErrorTransferHandler } from '../shared/comlinkErrorTransferHandler';
import {
    SearchWorkerDisconnectedError,
    SharedWorkerHeartbeatTimeout,
    sendErrorReportForSearch,
} from '../shared/errors';
import type { ClientId, SearchQuery, SearchResultItem, UserId, WorkerSearchResultEvent } from '../shared/types';
import type { SharedWorkerAPI } from '../worker/SharedWorkerAPI';
import type { IndexerState } from '../worker/indexer/IndexerTaskQueue';
import type { MainThreadBridge } from './MainThreadBridge';

// Set-up comlink to propagate errors properly.
// This must be called on both the main thread and the worker thread
// so that custom error types survive serialization across the comlink boundary.
registerComlinkErrorTransferHandler();

const HEARTBEAT_INTERVAL = 3000;
const HEARTBEAT_TIMEOUT = 5000;

export class WorkerClient {
    private api: Comlink.Remote<SharedWorkerAPI>;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private onBeforeUnload: () => void;
    private running = false;
    private connectionAbort = new AbortController();

    constructor(
        private userId: UserId,
        private appVersion: string,
        private clientId: ClientId,
        private bridge: MainThreadBridge
    ) {
        this.api = this.createWorker();

        this.startHeartbeat();

        this.onBeforeUnload = () => this.disconnect();
        window.addEventListener('beforeunload', this.onBeforeUnload);
    }

    private createWorker(): Comlink.Remote<SharedWorkerAPI> {
        const sharedWorkerName = `drive-search-worker/${this.appVersion}/${this.userId}`;
        Logger.info(`Starting worker client for worker <${sharedWorkerName}>`);

        /* webpackChunkName: "drive-search-sharedworker" */
        const worker = new SharedWorker(new URL('../worker/search.worker.ts', import.meta.url), {
            name: sharedWorkerName,
        });

        Logger.listenForWorkerLogs();

        return Comlink.wrap<SharedWorkerAPI>(worker.port);
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.heartbeatInterval = setInterval(() => {
            void this.heartbeatWithCheck();
        }, HEARTBEAT_INTERVAL);
    }

    // Two-way liveness check:
    //   The heartbeat serves both directions. The worker uses incoming heartbeats to detect
    //   dead clients (tab closed, navigated away). The client uses the response to detect a
    //   dead worker (crash, OOM, killed by user) - if the call doesn't resolve within
    //   HEARTBEAT_TIMEOUT, we reconnect (i.e. recreate a sharedworker).
    //
    //   False positives are safe: recreating a SharedWorker with the same name reuses the
    //   browser-managed singleton, and re-registering the client is a noop (covered by tests).
    private async heartbeatWithCheck() {
        try {
            await Promise.race([
                this.api.heartbeatClient(this.clientId),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new SharedWorkerHeartbeatTimeout()), HEARTBEAT_TIMEOUT)
                ),
            ]);
        } catch (error) {
            if (error instanceof SharedWorkerHeartbeatTimeout) {
                sendErrorReportForSearch('WorkerClient: heartbeat timed out, reconnecting to sharedworker', error);
                this.connectionAbort.abort(new SearchWorkerDisconnectedError());
                this.connectionAbort = new AbortController();

                // Try to recover and reconnect the timeout.
                this.reconnectSharedWorker();

                // TODO: Instrument sharedworker timeouts.
            } else {
                sendErrorReportForSearch('Error while emitting heartbeat from worker client', error);
                // No need to recover, another heartbeat will be sent by the periodic timer.
            }
        }
    }

    private reconnectSharedWorker() {
        Logger.info('WorkerClient: reconnecting');
        this.stopHeartbeat();

        // Jitter avoids all tabs reconnecting at the exact same instant.
        const jitter = Math.random() * 1000;
        setTimeout(() => {
            this.api = this.createWorker();

            this.startHeartbeat();

            // Re-register if we were running.
            if (this.running) {
                this.running = false;
                this.start();
            }
        }, jitter);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /** Register this client with the worker, triggering indexing. Safe to call multiple times. */
    start(): void {
        if (this.running) {
            return;
        }
        this.running = true;
        Logger.info('Registering search worker client');
        void this.api.registerClient(this.userId, this.clientId, Comlink.proxy(this.bridge));
    }

    async queryIndexerState(): Promise<IndexerState> {
        return this.api.queryIndexerState();
    }

    /** Clear all search data and restart indexing from scratch. */
    async reset(): Promise<void> {
        await this.api.reset();
        this.running = false;
    }

    async *search(query: SearchQuery): AsyncGenerator<SearchResultItem> {
        const queue = createAsyncQueue<SearchResultItem>();
        const signal = this.connectionAbort.signal;

        const onAbort = () => queue.error(signal.reason);
        signal.addEventListener('abort', onAbort);

        void this.api.search(
            query,
            Comlink.proxy((event: WorkerSearchResultEvent) => {
                if (event.type === 'done') {
                    queue.close();
                } else {
                    queue.push(event);
                }
            })
        );

        try {
            yield* queue.iterator();
        } finally {
            signal.removeEventListener('abort', onAbort);
        }
    }

    dispose(): void {
        this.disconnect();
    }

    private disconnect() {
        this.stopHeartbeat();
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        void this.api.disconnectClient(this.clientId);
    }
}
