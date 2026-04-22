import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { Logger } from '../shared/Logger';
import { SearchDB } from '../shared/SearchDB';
import type { SearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type { ClientId, SearchQuery, UserId, WorkerSearchResultEvent } from '../shared/types';
import type { ClientContext } from './ClientCoordinator';
import { ClientCoordinator } from './ClientCoordinator';
import { SearchIndexKeyManager } from './SearchIndexKeyManager';
import { IndexRegistry } from './index/IndexRegistry';
import type { IndexerState } from './indexer/IndexerTaskQueue';
import { DEFAULT_INDEXER_STATE, IndexerTaskQueue } from './indexer/IndexerTaskQueue';
import { TreeSubscriptionRegistry } from './indexer/TreeSubscriptionRegistry';
import { SearchQueryExecutor } from './searcher/SearchQueryExecutor';

/**
 * SharedWorker API exposed via Comlink.
 * Manages a single IndexerTaskQueue (no orchestrator). Coordinates clients across tabs.
 */
export class SharedWorkerAPI {
    private clientsCoordinator = new ClientCoordinator();
    private indexRegistry: IndexRegistry | null = null;
    private db: SearchDB | null = null;
    private indexer: IndexerTaskQueue | null = null;
    private searcher: SearchQueryExecutor | null = null;
    private stateChannel: SearchModuleStateUpdateChannel | null = null;

    constructor() {
        this.clientsCoordinator.subscribeClientChanged(this.handleActiveClientChanged.bind(this));
    }

    private async getDb(userId: string) {
        if (!this.db) {
            this.db = await SearchDB.open(userId);
        }
        return this.db;
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

    /** Return the current indexer state. Can be called before any client registers. */
    async queryIndexerState(): Promise<IndexerState> {
        return this.indexer?.getState() ?? DEFAULT_INDEXER_STATE;
    }

    /** Clear all search data and restart indexing from scratch. */
    async reset(): Promise<void> {
        Logger.info('SharedWorkerAPI: resetting search data');
        this.indexer?.stop();
        this.indexer = null;
        this.searcher = null;

        this.indexRegistry?.disposeAll();

        if (this.db) {
            await this.db.clear();
        }

        // Notify all tabs that search has been deactivated.
        this.stateChannel?.postMessage({
            isUserOptIn: false,
            isInitialIndexing: false,
            isIndexing: false,
            isSearchable: false,
            permanentError: null,
            indexPopulatorStatuses: [],
        });

        // Clear active client so the next start() → registerClient triggers onClientAvailable.
        this.clientsCoordinator.clearActiveClient();
    }

    async reindexPopulator(uid: string): Promise<void> {
        if (!this.indexer) {
            Logger.warn('SharedWorkerAPI: reindexPopulator called but no indexer available');
            return;
        }
        await this.indexer.reindexPopulator(uid);
    }

    async search(query: SearchQuery, onEvent?: (event: WorkerSearchResultEvent) => void): Promise<void> {
        if (!this.searcher) {
            // TODO: Handle error
            Logger.error('SharedWorkerAPI: search called but no searcher available');
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
            this.disposeInternals();
        }
    }

    private disposeInternals() {
        this.indexer?.stop();
        this.indexer = null;
        this.searcher = null;
        this.stateChannel?.close();
        this.stateChannel = null;
        this.indexRegistry?.disposeAll();
        this.indexRegistry = null;
    }

    /**
     * Lazily creates the IndexRegistry, resolving the crypto key on first call.
     */
    private async getRegistry(db: SearchDB, bridge: MainThreadBridge): Promise<IndexRegistry> {
        if (this.indexRegistry) {
            return this.indexRegistry;
        }

        const { cryptoKey } = await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        this.indexRegistry = new IndexRegistry(cryptoKey);
        return this.indexRegistry;
    }

    private async onClientAvailable(clientContext: ClientContext): Promise<void> {
        this.disposeInternals();

        try {
            const db = await this.getDb(clientContext.userId);
            const indexRegistry = await this.getRegistry(db, clientContext.bridge);

            const treeSubscriptionRegistry = await TreeSubscriptionRegistry.create(clientContext.bridge, db);
            this.searcher = new SearchQueryExecutor(indexRegistry, db);
            this.indexer = new IndexerTaskQueue(
                clientContext.userId,
                indexRegistry,
                clientContext.bridge,
                db,
                treeSubscriptionRegistry
            );

            this.stateChannel = createSearchModuleStateUpdateChannel(clientContext.userId);

            // Broadcast initial indexer state so late-joining tabs don't stay at defaults.
            this.stateChannel.postMessage(this.indexer.getState());
            this.indexer.onStateChange((state) => {
                this.stateChannel?.postMessage({
                    isInitialIndexing: state.isInitialIndexing,
                    isIndexing: state.isIndexing,
                    isSearchable: state.isSearchable,
                    permanentError: state.permanentError,
                    indexPopulatorStatuses: state.indexPopulatorStatuses,
                });
            });

            await this.indexer.start();
        } catch (error) {
            Logger.error('SharedWorkerAPI: failed to start indexer', error);
            throw error;
        }
    }
}
