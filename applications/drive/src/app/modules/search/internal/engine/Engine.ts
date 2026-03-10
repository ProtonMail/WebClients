import type { InitOutput } from '@proton/proton-foundation-search';
import init, { Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';

import type { ActiveMainThreadBridgeService } from '../ActiveMainThreadBridgeService';
import type { EngineConfigKey } from './configs';
import { IndexWriter } from './core/indexer/IndexWriter';
import { IndexerState, IndexerStateMachine } from './core/indexer/IndexerStateMachine';
import type { EngineDB } from './storage/EngineDB';

// The search foundation WASM library needs to be initialized once per
// page load — hence we set this loading state on the module itself.
let searchFoundationInitialized: Promise<InitOutput> | undefined;

export interface EngineParams {
    configKey: EngineConfigKey;
    db: EngineDB;
    bridgeService: ActiveMainThreadBridgeService;
}

type EngineState = {
    // True while the index is being built from scratch (bulk update).
    isInitialIndexing: boolean;
    // True when the index is ready for queries. Can be true even during initial
    // indexing if a usable index from a previous config still exists.
    isSearchable: boolean;
};

/**
 * Manages the lifecycle of a single search index: building it by indexing drive items
 * and querying it. One Engine instance corresponds to one index configuration.
 */
export class Engine {
    private engineState: EngineState;
    private subscribers = new Set<(state: EngineState) => void>();

    private constructor(
        private readonly indexerStateMachine: IndexerStateMachine,
        private readonly db: EngineDB,
        isSearchable: boolean
    ) {
        this.engineState = {
            isInitialIndexing: false,
            isSearchable,
        };

        indexerStateMachine.onStateChange(async (indexerState) => {
            // Re-check the DB on every state transition: activeConfigKey being set is
            // the authoritative signal that the index is ready to be queried.
            const isSearchable = await Engine.isSearchable(this.db);
            this.engineState = {
                isInitialIndexing: indexerState === IndexerState.BULK_UPDATE,
                isSearchable,
            };
            this.subscribers.forEach((cb) => cb(this.engineState));
        });
    }

    private static async isSearchable(db: EngineDB): Promise<boolean> {
        const engineState = await db.getEngineState();
        return engineState.activeConfigKey !== null;
    }

    /**
     * Async factory: Awaits WASM initialisation and wires up all dependencies.
     * Reads the DB to determine whether the index is already queryable from a prior session.
     */
    static async create(params: EngineParams): Promise<Engine> {
        // Awaits search library WASM initialisation
        await (searchFoundationInitialized ??= init());

        const isSearchable = await Engine.isSearchable(params.db);

        const searchFoundationEngine = SearchLibraryWasmEngine.builder().build();
        const indexWriter = new IndexWriter(params.db, params.configKey, searchFoundationEngine);
        const indexerStateMachine = new IndexerStateMachine({
            requiredConfigKey: params.configKey,
            db: params.db,
            bridgeService: params.bridgeService,
            indexWriter,
        });

        return new Engine(indexerStateMachine, params.db, isSearchable);
    }

    getState(): EngineState {
        return this.engineState;
    }

    onStateChange(cb: (state: EngineState) => void): () => void {
        this.subscribers.add(cb);
        return () => {
            this.subscribers.delete(cb);
        };
    }

    async startIndexing(): Promise<void> {
        await this.indexerStateMachine.start();
    }

    stopIndexing(): void {
        this.indexerStateMachine.stop();
    }

    // TODO: search(query: SearchQuery): Promise<SearchResult[]> — wire up WASM searcher once Searcher is added to EngineConfig.
}
