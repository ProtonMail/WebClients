import * as Comlink from 'comlink';

import { createAsyncQueue } from '../../../utils/asyncQueue';
import { Logger } from './Logger';
import type { MainThreadBridge } from './MainThreadBridge';
import type { ClientId, SearchQuery, SearchResultItem, UserId, WorkerSearchResultEvent } from './types';
import type { SharedWorkerAPI } from './worker/SharedWorkerAPI';

const HEARTBEAT_INTERVAL = 3000;

export class WorkerClient {
    private api: Comlink.Remote<SharedWorkerAPI>;
    private heartbeatInterval: ReturnType<typeof setInterval>;
    private onBeforeUnload: () => void;

    constructor(
        userId: UserId,
        appVersion: string,
        private clientId: ClientId,
        bridge: MainThreadBridge
    ) {
        // The SharedWorker name acts as a namespace that scopes the worker instance by user and app version.
        // Browsers reuse an existing SharedWorker when a new tab/window requests one with the same name and URL —
        // so namespacing prevents unrelated contexts from sharing the same worker.
        //
        // - userId: ensures two different logged-in users never share the same worker,
        //   preventing cross-user data leaks or incorrect search results.
        //
        // - appVersion: ensures a tab running new code never connects to a worker spawned
        //   by an older version. Without this, a stale worker could execute outdated logic
        //   (e.g. an old indexer or searcher) while new tabs assume the current behavior,
        //   leading to subtle bugs. Each deploy gets its own isolated worker instance.
        //
        // Example:
        //
        //   Tab A (Alice, v1)  ──┐
        //   Tab B (Alice, v1)  ──┼──► SharedWorker "drive-search-worker/v1/alice-id"
        //   Tab C (Alice, v1)  ──┘
        //
        //   Tab D (Alice, v2)  ──────► SharedWorker "drive-search-worker/v2/alice-id"  (new deploy)
        //
        //   Tab E (Bob, v2)    ──────► SharedWorker "drive-search-worker/v2/bob-id"
        const sharedWorkerName = `drive-search-worker/${appVersion}/${userId}`;
        Logger.info(`Starting worker client for worker <${sharedWorkerName}>`);

        /* webpackChunkName: "drive-search-sharedworker" */
        const worker = new SharedWorker(new URL('./worker/search.worker.ts', import.meta.url), {
            name: sharedWorkerName,
        });
        this.api = Comlink.wrap<SharedWorkerAPI>(worker.port);

        Logger.listenForWorkerLogs();

        void this.api.registerClient(userId, this.clientId, Comlink.proxy(bridge));

        this.heartbeatInterval = setInterval(() => {
            void this.api.heartbeatClient(this.clientId);
        }, HEARTBEAT_INTERVAL);

        this.onBeforeUnload = () => this.disconnect();
        window.addEventListener('beforeunload', this.onBeforeUnload);
    }

    async *search(query: SearchQuery): AsyncGenerator<SearchResultItem> {
        const queue = createAsyncQueue<SearchResultItem>();

        // The worker streams results as WorkerSearchResultEvent through a single
        // Comlink-proxied callback (one MessagePort) to guarantee delivery order.
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
