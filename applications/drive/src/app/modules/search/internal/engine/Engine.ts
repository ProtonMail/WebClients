import type { InitOutput } from '@proton/proton-foundation-search';
import init, { Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';

import type { ActiveMainThreadBridgeService } from '../ActiveMainThreadBridgeService';
import { InvalidSearcherConfig, InvalidSearcherState } from '../errors';
import type { SearchQuery } from '../types';
import type { EngineConfig, EngineConfigKey } from './configs';
import { getEngineConfigFromString } from './configs';
import { IndexWriter } from './core/indexer/IndexWriter';
import { IndexerState, IndexerStateMachine } from './core/indexer/IndexerStateMachine';
import type { EngineSearchItem } from './core/searcher/BaseSearcher';
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
        private readonly searchFoundationEngine: SearchLibraryWasmEngine,
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

        // TODO: Configure ProcessorConfig with min_length=1 once the WASM library exposes a public constructor.
        // Current default min_length is 3 — queries shorter than 3 characters return no results.
        const searchFoundationEngine = SearchLibraryWasmEngine.builder().build();
        const indexWriter = new IndexWriter(params.db, params.configKey, searchFoundationEngine);
        const indexerStateMachine = new IndexerStateMachine({
            requiredConfigKey: params.configKey,
            db: params.db,
            bridgeService: params.bridgeService,
            indexWriter,
        });

        return new Engine(indexerStateMachine, searchFoundationEngine, params.db, isSearchable);
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

    async *search(query: SearchQuery): AsyncGenerator<EngineSearchItem> {
        const activeEngineConfig = await this.getRequiredActiveConfigKeyForSearch();
        // The active engine config can be updated at anytime by the engine indexer.
        // Make sure we always get the latest config and create a fresh Searcher instance
        // in case of an update.
        const searcher = new activeEngineConfig.Searcher({
            engine: this.searchFoundationEngine,
            db: this.db,
        });

        yield* searcher.performSearch(query, activeEngineConfig.configKey);
    }

    private async getRequiredActiveConfigKeyForSearch(): Promise<EngineConfig> {
        const engineState = await this.db.getEngineState();
        if (engineState.activeConfigKey === null) {
            // No active config yet: Was the search action performed before
            // the index is ready and the active config updated?
            throw new InvalidSearcherState('No active engine config while searching');
        }
        const engineConfig = getEngineConfigFromString(engineState.activeConfigKey);
        if (engineConfig === null) {
            // The found active version in DB was not found in the list of active configs.
            // Probably an old config not supported, the fix is probably to clear all
            // search states and start over.
            throw new InvalidSearcherConfig('Active config not found in config repository');
        }

        return engineConfig;
    }
}
