import type { Engine, InitOutput } from '@proton/proton-foundation-search';
import init, { ProcessorConfig, Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';

import type { SearchDB } from '../../shared/SearchDB';
import { MAX_SEARCHABLE_FILENAME_LENGTH } from '../../shared/config';
import type { IndexKind } from '../../shared/types';
import { IndexBlobStore } from './IndexBlobStore';
import { IndexReader } from './IndexReader';
import { IndexWriter } from './IndexWriter';

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
 * Creates and stores WASM search engine instances paired with their blob store.
 * Each IndexKind maps to one index (engine + blob store).
 */
export class IndexRegistry {
    private readonly instances = new Map<IndexKind, IndexInstance>();

    /**
     * Return the engine instance for the given kind, creating it if it doesn't exist yet.
     */
    async get(kind: IndexKind, db: SearchDB): Promise<IndexInstance> {
        const existing = this.instances.get(kind);
        if (existing) {
            return existing;
        }
        await (wasmInit ??= init());

        const config = new ProcessorConfig().withMaxLength(MAX_SEARCHABLE_FILENAME_LENGTH);
        const engine = SearchLibraryWasmEngine.builder().withBuiltinProcessor(config).build();
        const blobStore = new IndexBlobStore(kind, db);
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
        if (instance) {
            instance.engine.free();
            this.instances.delete(kind);
        }
    }

    disposeAll(): void {
        for (const [kind] of this.instances) {
            this.dispose(kind);
        }
    }
}
