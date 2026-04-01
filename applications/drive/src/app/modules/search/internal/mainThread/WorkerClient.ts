import * as Comlink from 'comlink';

import { createAsyncQueue } from '../../../../utils/asyncQueue';
import { Logger } from '../shared/Logger';
import type { ClientId, SearchQuery, SearchResultItem, UserId, WorkerSearchResultEvent } from '../shared/types';
import type { SharedWorkerAPI } from '../worker/SharedWorkerAPI';
import type { IndexerState } from '../worker/indexer/IndexerTaskQueue';
import type { MainThreadBridge } from './MainThreadBridge';

const HEARTBEAT_INTERVAL = 3000;

export class WorkerClient {
    private api: Comlink.Remote<SharedWorkerAPI>;
    private heartbeatInterval: ReturnType<typeof setInterval>;
    private onBeforeUnload: () => void;
    private running = false;

    constructor(
        private userId: UserId,
        appVersion: string,
        private clientId: ClientId,
        private bridge: MainThreadBridge
    ) {
        const sharedWorkerName = `drive-search-worker/${appVersion}/${userId}`;
        Logger.info(`Starting worker client for worker <${sharedWorkerName}>`);

        /* webpackChunkName: "drive-search-sharedworker" */
        const worker = new SharedWorker(new URL('../worker/search.worker.ts', import.meta.url), {
            name: sharedWorkerName,
        });
        this.api = Comlink.wrap<SharedWorkerAPI>(worker.port);

        Logger.listenForWorkerLogs();

        this.heartbeatInterval = setInterval(() => {
            void this.api.heartbeatClient(this.clientId);
        }, HEARTBEAT_INTERVAL);

        this.onBeforeUnload = () => this.disconnect();
        window.addEventListener('beforeunload', this.onBeforeUnload);
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

        yield* queue.iterator();
    }

    dispose(): void {
        this.disconnect();
    }

    private disconnect() {
        clearInterval(this.heartbeatInterval);
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        void this.api.disconnectClient(this.clientId);
    }
}
