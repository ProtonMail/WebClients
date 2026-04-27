import type { Entry } from '@proton/proton-foundation-search';

import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { Logger } from '../shared/Logger';
import { SearchDB } from '../shared/SearchDB';
import type { SearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type {
    ClientId,
    IndexKind,
    SearchQuery,
    SerializedAttributeValue,
    SerializedIndexEntry,
    UserId,
    WorkerIndexExportEvent,
    WorkerSearchResultEvent,
} from '../shared/types';
import type { ClientContext } from './ClientCoordinator';
import { ClientCoordinator } from './ClientCoordinator';
import { SearchIndexKeyManager } from './SearchIndexKeyManager';
import { IndexRegistry } from './index/IndexRegistry';
import { exportEntries, removeDocumentIds } from './index/indexEntriesUtils';
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

    /**
     * Stream every entry of a given index to the caller. Emits one event per
     * entry, followed by a single `done` event. Diagnostics-only.
     */
    async exportIndexEntries(kind: IndexKind, onEvent?: (event: WorkerIndexExportEvent) => void): Promise<void> {
        if (!this.indexRegistry || !this.db) {
            Logger.warn('SharedWorkerAPI: exportIndexEntries called before indexer was available');
            onEvent?.({ type: 'done' });
            return;
        }
        const instance = await this.indexRegistry.get(kind, this.db);
        const controller = new AbortController();
        try {
            for await (const entry of exportEntries(instance, controller.signal)) {
                onEvent?.({ type: 'entry', ...serializeEntry(entry) });
            }
        } finally {
            onEvent?.({ type: 'done' });
        }
    }

    /** Sum of encrypted blob byte lengths for the given index. Diagnostics-only. */
    async getIndexByteSize(kind: IndexKind): Promise<number> {
        if (!this.db) {
            Logger.warn('SharedWorkerAPI: getIndexByteSize called before DB was available');
            return 0;
        }
        return this.db.getIndexBlobsByteSize(kind);
    }

    /** Remove a single document by identifier from the given index. Diagnostics-only. */
    async removeIndexEntry(kind: IndexKind, identifier: string): Promise<void> {
        if (!this.indexRegistry || !this.db) {
            Logger.warn('SharedWorkerAPI: removeIndexEntry called before indexer was available');
            return;
        }
        const instance = await this.indexRegistry.get(kind, this.db);
        await removeDocumentIds(instance, [identifier], new AbortController().signal);
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

function serializeEntry(entry: Entry): SerializedIndexEntry {
    const attributes: Record<string, SerializedAttributeValue[]> = {};
    for (const name of entry.attributes()) {
        const values = entry.attribute(name);
        attributes[name] = values.map((v) => {
            const raw = v.value();
            v.free();
            return toSerializedAttributeValue(raw, name);
        });
    }
    return { identifier: entry.identifier(), attributes };
}

function toSerializedAttributeValue(raw: unknown, attributeName: string): SerializedAttributeValue {
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'bigint' || typeof raw === 'boolean') {
        return raw;
    }
    if (raw !== null && typeof raw === 'object') {
        try {
            return JSON.stringify(raw);
        } catch {}
    }
    Logger.warn(`serializeEntry: unexpected attribute value for <${attributeName}>: type=${typeof raw}`);
    return String(raw);
}
