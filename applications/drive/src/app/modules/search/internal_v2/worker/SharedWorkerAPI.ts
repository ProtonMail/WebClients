import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { Logger } from '../shared/Logger';
import { SearchDB } from '../shared/SearchDB';
import type { SearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type { ClientId, SearchQuery, UserId, WorkerSearchResultEvent } from '../shared/types';
import type { ClientContext } from './ClientCoordinator';
import { ClientCoordinator } from './ClientCoordinator';
import { IndexRegistry } from './index/IndexRegistry';
import { IndexerTaskQueue } from './indexer/IndexerTaskQueue';
import { TreeSubscriptionRegistry } from './indexer/TreeSubscriptionRegistry';
import { SearchQueryExecutor } from './searcher/SearchQueryExecutor';

/**
 * SharedWorker API exposed via Comlink.
 * Manages a single IndexerTaskQueue (no orchestrator). Coordinates clients across tabs.
 */
export class SharedWorkerAPI {
    private clientsCoordinator = new ClientCoordinator();
    private readonly indexRegistry = new IndexRegistry();
    private indexer: IndexerTaskQueue | null = null;
    private searcher: SearchQueryExecutor | null = null;
    private stateChannel: SearchModuleStateUpdateChannel | null = null;

    constructor() {
        this.clientsCoordinator.subscribeClientChanged(this.handleActiveClientChanged.bind(this));
    }

    async registerClient(userId: UserId, clientId: ClientId, bridge: MainThreadBridge): Promise<void> {
        this.clientsCoordinator.register(userId, clientId, bridge);
    }

    heartbeatClient(clientId: ClientId): void {
        this.clientsCoordinator.heartbeat(clientId);
    }

    disconnectClient(clientId: ClientId): void {
        this.clientsCoordinator.disconnect(clientId);
    }

    async search(query: SearchQuery, onEvent?: (event: WorkerSearchResultEvent) => void): Promise<void> {
        if (!this.searcher) {
            Logger.warn('SharedWorkerAPI: search called but no searcher available');
            onEvent?.({ type: 'done' });
            return;
        }
        for await (const item of this.searcher.performSearch(query)) {
            onEvent?.({ type: 'item', ...item });
        }
        onEvent?.({ type: 'done' });
    }

    private handleActiveClientChanged(newClientContext: ClientContext | null) {
        if (newClientContext) {
            void this.onClientAvailable(newClientContext);
        } else {
            this.indexer?.stop();
            this.indexer = null;
            this.searcher = null;
        }
    }

    private async onClientAvailable(clientContext: ClientContext): Promise<void> {
        // Stop existing indexer if running — bridge changed (tab swap).
        if (this.indexer) {
            this.indexer.stop();
            this.indexer = null;
            this.searcher = null;
        }

        try {
            const db = await SearchDB.open(clientContext.userId);

            const treeSubscriptionRegistry = await TreeSubscriptionRegistry.create(clientContext.bridge, db);
            this.searcher = new SearchQueryExecutor(this.indexRegistry, db);
            this.indexer = new IndexerTaskQueue(this.indexRegistry, clientContext.bridge, db, treeSubscriptionRegistry);

            this.stateChannel = createSearchModuleStateUpdateChannel(clientContext.userId);
            this.indexer.onStateChange((state) => {
                this.stateChannel?.postMessage({
                    isInitialIndexing: state.isInitialIndexing,
                    isIndexing: state.isIndexing,
                    isSearchable: state.isSearchable,
                });
            });

            await this.indexer.start();
        } catch (error) {
            Logger.error('SharedWorkerAPI: failed to start indexer', error);
            throw error;
        }
    }
}
