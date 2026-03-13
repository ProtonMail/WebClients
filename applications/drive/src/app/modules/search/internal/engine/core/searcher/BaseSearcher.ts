import type { Query, Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';
import { QueryEventKind, SerDes } from '@proton/proton-foundation-search';

import { SearchLibraryError } from '../../../errors';
import type { SearchQuery } from '../../../types';
import type { EngineConfigKey } from '../../configs';
import type { EngineDB } from '../../storage/EngineDB';

export type EngineSearchItem = { nodeUid: string; score: number };

export interface SearcherParams {
    engine: SearchLibraryWasmEngine;
    db: EngineDB;
}

/**
 * Runs a search query against the search library WASM engine
 */
export abstract class BaseSearcher {
    constructor(private readonly params: SearcherParams) {}

    /**
     * Translate a user-facing SearchQuery into a search library WASM Query ready to execute.
     * To be implemented by each BaseSearcher implementaions.
     */
    protected abstract buildQuery(query: SearchQuery, wasmQuery: Query): Query;

    async *performSearch(query: SearchQuery, activeConfigKey: EngineConfigKey): AsyncGenerator<EngineSearchItem> {
        const { engine, db } = this.params;
        const search = this.buildQuery(query, engine.query()).search();

        try {
            let event;
            while ((event = search.next()) !== undefined) {
                switch (event.kind()) {
                    case QueryEventKind.Load: {
                        const blobName = event.id().toString();

                        const stored = await db.getIndexBlob(activeConfigKey, blobName);
                        try {
                            if (stored !== undefined) {
                                event.send(SerDes.Cbor, new Uint8Array(stored));
                            } else {
                                event.sendEmpty();
                            }
                        } catch (e) {
                            throw new SearchLibraryError(
                                'Search library WASM failed to load index blob during query',
                                e
                            );
                        }
                        break;
                    }
                    case QueryEventKind.Found: {
                        // event.found() consumes the event — do not call event.free() after.
                        const found = event.found();
                        if (found) {
                            const score = found.score();
                            yield { nodeUid: found.identifier(), score: score.value() };
                            score.free();
                            found.free();
                        }
                        break;
                    }
                    case QueryEventKind.Stats:
                    default:
                        event.free();
                        break;
                }
            }
        } finally {
            search.free();
        }
    }
}
