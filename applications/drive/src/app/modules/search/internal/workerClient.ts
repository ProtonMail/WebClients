import * as Comlink from 'comlink';

import { Logger } from './Logger';
import type { ClientId, UserId } from './types';
import type { SharedWorkerAPI } from './worker/SharedWorkerAPI';
import type { MainThreadBridge } from './worker/indexing/types';

const HEARTBEAT_INTERVAL = 3000;

export class WorkerClient {
    private api: Comlink.Remote<SharedWorkerAPI>;
    private heartbeatInterval: ReturnType<typeof setInterval>;
    private onBeforeUnload: () => void;

    constructor(
        userId: UserId,
        private clientId: ClientId,
        bridge: MainThreadBridge
    ) {
        Logger.info('Starting worker client');

        /* webpackChunkName: "drive-search-sharedworker" */
        const worker = new SharedWorker(new URL('./worker/search.worker.ts', import.meta.url), {
            // The SharedWorker name acts as a namespace that scopes the worker instance to a specific user.
            // Browsers reuse an existing SharedWorker when a new tab/window requests one with the same name and URL —
            // so namespacing by userId ensures that two different logged-in users never accidentally share the same worker.
            //
            // Example: Alice and Bob are both logged in on separate tabs in the same browser session.
            //
            //   Tab A (Alice)  ──┐
            //   Tab B (Alice)  ──┼──► SharedWorker "drive-search-worker-alice-id"  (Alice's index)
            //   Tab C (Alice)  ──┘
            //
            //   Tab D (Bob)    ──┬──► SharedWorker "drive-search-worker-bob-id"    (Bob's index)
            //   Tab E (Bob)    ──┘
            //
            // Without this namespacing, all tabs would connect to the same worker instance regardless of which
            // user is logged in, leading to cross-user data leaks or incorrect search results.
            name: `drive-search-worker-${userId}`,
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

    // TODO: Add methods to search or read the current state of indexing.

    private disconnect() {
        clearInterval(this.heartbeatInterval);
        window.removeEventListener('beforeunload', this.onBeforeUnload);
        void this.api.disconnectClient(this.clientId);
    }
}
