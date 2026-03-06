import type { InitOutput } from '@proton/proton-foundation-search';
import init, { Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';

import type { MainThreadBridgeService } from '../MainThreadBridgeService';
import type { EngineConfigKey } from './configs';
import { IndexWriter } from './core/indexer/IndexWriter';
import { IndexerStateMachine } from './core/indexer/IndexerStateMachine';
import type { EngineDB } from './storage/EngineDB';

// The search foundation WASM library needs to be initialized once per
// page load — hence we set this loading state on the module itself.
let searchFoundationInitialized: Promise<InitOutput> | undefined;

export interface EngineParams {
    configKey: EngineConfigKey;
    db: EngineDB;
    bridgeService: MainThreadBridgeService;
}

/**
 * Manages the lifecycle of a single search index: building it by indexing drive items
 * and querying it. One Engine instance corresponds to one index configuration.
 */
export class Engine {
    private constructor(private readonly indexerStateMachine: IndexerStateMachine) {}

    /**
     * Async factory: Awaits WASM initialisation and wires up all dependencies.
     */
    static async create(params: EngineParams): Promise<Engine> {
        await (searchFoundationInitialized ??= init());

        const searchFoundationEngine = SearchLibraryWasmEngine.builder().build();
        const indexWriter = new IndexWriter(params.db, params.configKey, searchFoundationEngine);
        const indexerStateMachine = new IndexerStateMachine({
            requiredConfigKey: params.configKey,
            db: params.db,
            bridgeService: params.bridgeService,
            indexWriter,
        });

        return new Engine(indexerStateMachine);
    }

    async startIndexing(): Promise<void> {
        await this.indexerStateMachine.start();
    }

    stopIndexing(): void {
        this.indexerStateMachine.stop();
    }

    // TODO: search(query: string): Promise<SearchResult[]>
}
