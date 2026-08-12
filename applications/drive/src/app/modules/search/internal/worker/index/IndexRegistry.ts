import type { Engine, InitOutput } from '@proton/proton-foundation-search';
import init, {
    ProcessorConfig,
    Engine as SearchLibraryWasmEngine,
    TextIndex,
    TrigramCache,
} from '@proton/proton-foundation-search';

import type { SearchDB } from '../../shared/SearchDB';
import {
    SEARCH_ENGINE_CASE_INSENSITIVE,
    SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH,
    SEARCH_ENGINE_MAX_TOKEN_BUCKET_SIZE,
} from '../../shared/config';
import { sendErrorReportForSearch } from '../../shared/errors';
import { searchMetrics } from '../../shared/searchMetrics';
import type { IndexKind } from '../../shared/types';
import { IndexBlobStore } from './IndexBlobStore';
import { IndexReader } from './IndexReader';
import { IndexWriter } from './IndexWriter';
import { engineCall, toEngineError } from './engineCall';

export { IndexKind } from '../../shared/types';

export interface IndexInstance {
    indexKind: IndexKind;
    engine: Engine;
    blobStore: IndexBlobStore;
    indexWriter: IndexWriter;
    indexReader: IndexReader;
}

let wasmInit: Promise<InitOutput> | undefined;

/**
 * Loads the WASM module, once per worker.
 */
async function initWasm(): Promise<InitOutput> {
    if (!wasmInit) {
        wasmInit = init().catch((error: unknown) => {
            wasmInit = undefined;
            searchMetrics.markSearchOtherError({ error });
            throw error;
        });
    }
    return wasmInit;
}

/**
 * Creates and stores WASM search engine instances paired with their blob store.
 * Each IndexKind maps to one index (engine + blob store).
 */
export class IndexRegistry {
    private readonly instances = new Map<IndexKind, IndexInstance>();

    constructor(private readonly cryptoKey: CryptoKey) {}

    /**
     * Return the engine instance for the given kind, creating it if it doesn't exist yet.
     */
    async get(kind: IndexKind, db: SearchDB): Promise<IndexInstance> {
        const existing = this.instances.get(kind);
        if (existing) {
            return existing;
        }
        await initWasm();

        const engine = engineCall('engine build', () => {
            const config = new ProcessorConfig()
                .withMaxLength(SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH)
                .withCaseInsensitive(SEARCH_ENGINE_CASE_INSENSITIVE);
            const textIndex = new TextIndex()
                .withMaximumTokenBucketSize(SEARCH_ENGINE_MAX_TOKEN_BUCKET_SIZE)
                // Avoid perf issues on search library 2.0.0-rc1 version.
                // TODO: re-check whether this workaround is still needed after upgrading past 2.0.0-rc1.
                .withTrigramCache(TrigramCache.Disabled);

            return (
                SearchLibraryWasmEngine.builder()
                    .withBuiltinProcessor(config)
                    // with_default_indices() registers all four built-in index types in one call, so a
                    // future library version adding a fifth default index type is included automatically,
                    // no risk of silently omitting one.
                    .withDefaultIndices()
                    .withTextIndex(textIndex)
                    .build()
            );
        });
        const blobStore = new IndexBlobStore(kind, db, this.cryptoKey);
        const indexWriter = new IndexWriter(engine, blobStore);
        const indexReader = new IndexReader(engine, blobStore);
        const instance: IndexInstance = { indexKind: kind, engine, blobStore, indexWriter, indexReader };
        this.instances.set(kind, instance);
        return instance;
    }

    getAll(): IterableIterator<IndexInstance> {
        return this.instances.values();
    }

    dispose(kind: IndexKind): void {
        const instance = this.instances.get(kind);
        if (!instance) {
            return;
        }
        this.instances.delete(kind);
        // Swallowed rather than thrown: disposeAll() runs at the top of `rebuild()` and `reset()`,
        // before the index is cleared, and as the first step of re-initialising the worker for a
        // new client. A throwing free() there would break the very recovery path the user is told
        // to take when the engine is already wedged.
        try {
            instance.engine.free();
        } catch (e) {
            sendErrorReportForSearch(`IndexRegistry: failed to free engine <${kind}>`, toEngineError('engine free', e));
        }
    }

    disposeAll(): void {
        for (const kind of this.instances.keys()) {
            this.dispose(kind);
        }
    }
}
