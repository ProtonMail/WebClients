import type { Engine, Execution, Write, WriteEvent } from '@proton/proton-foundation-search';
import { Document, Value, WriteEventKind } from '@proton/proton-foundation-search';

import { InvalidIndexerState, sendErrorReportForSearch } from '../../shared/errors';
import type { AttributeValue, IndexEntry } from '../indexer/indexEntry';
import type { IndexBlobStore } from './IndexBlobStore';
import { engineCall, toEngineError } from './engineCall';

/**
 * An exclusive write session acquired from IndexWriter.startWriteSession().
 *
 * Holds a Write handle from the search library WASM. Callers chain insert/remove
 * calls then await commit() to flush. Uses IndexBlobStore as the blob store.
 */
export class WriteSession {
    private writer: Write | null;

    constructor(
        writer: Write,
        private readonly blobStore: IndexBlobStore,
        private readonly release: () => void
    ) {
        this.writer = writer;
    }

    insert(entry: IndexEntry): this {
        if (this.writer === null) {
            throw new InvalidIndexerState("WriteSession: can't insert, session already released");
        }
        try {
            const doc = new Document(entry.documentId);
            for (const attr of entry.attributes) {
                doc.addAttribute(attr.name, toValue(attr.value));
            }
            this.writer.insert(doc);
            return this;
        } catch (e) {
            // dispose() releases the lock before freeing and swallows a throwing free(), so the
            // error reported here is always the one that actually broke the insert.
            this.dispose();
            throw toEngineError('insert', e);
        }
    }

    remove(documentId: string): this {
        if (this.writer === null) {
            throw new InvalidIndexerState("WriteSession: can't remove, session already released");
        }
        try {
            this.writer.remove(documentId);
            return this;
        } catch (e) {
            this.dispose();
            throw toEngineError('remove', e);
        }
    }

    dispose(): void {
        if (this.writer === null) {
            return;
        }
        const writer = this.writer;
        // Clear state and release the lock before free(): dispose() is called from `finally`
        // blocks, so a throwing free() would otherwise leave the session half-released and hold
        // the write lock for the rest of the session.
        this.writer = null;
        this.release();
        try {
            writer.free();
        } catch (e) {
            sendErrorReportForSearch('WriteSession: failed to free writer handle', toEngineError('free', e));
        }
    }

    async commit(): Promise<void> {
        if (this.writer === null) {
            throw new InvalidIndexerState("WriteSession: can't commit, session already released");
        }
        let execution: Execution;
        try {
            execution = this.writer.commit();
            // Commit consumer the writer, no need to free.
            this.writer = null;
        } catch (e) {
            this.dispose();
            throw toEngineError('commit', e);
        }

        try {
            // `execution.next()`, `event.kind()` and `event.free()` are all WASM calls: they used
            // to throw raw (the "unreachable" panic surfaces here, from the Save branch), so this
            // block had a `finally` but no `catch`.
            let next: WriteEvent | undefined;
            while ((next = engineCall('commit: next event', () => execution.next())) !== undefined) {
                // Bound to a const so the closures below keep the non-undefined narrowing.
                const event = next;
                const kind = engineCall('commit: event kind', () => event.kind());
                switch (kind) {
                    case WriteEventKind.Load:
                        await this.blobStore.loadEvent(event);
                        break;
                    case WriteEventKind.Save:
                        await this.blobStore.saveEvent(event);
                        break;
                    case WriteEventKind.Stats:
                        engineCall('commit: free event', () => event.free());
                        break;
                    default:
                        const error = new Error(`WriteSession: unexpected Write event kind <${kind}>`);
                        sendErrorReportForSearch(error.message, error);

                        engineCall('commit: free event', () => event.free());
                        break;
                }
            }
        } finally {
            // Release the write lock first, and never let a throwing free() escape: raised from a
            // `finally` it would both mask the in-flight error and skip the release, wedging the
            // writer for the rest of the session.
            this.release();
            try {
                execution?.free();
            } catch (e) {
                sendErrorReportForSearch('WriteSession: failed to free execution handle', toEngineError('free', e));
            }
        }
    }
}

/**
 * Issues exclusive WriteSession handles for a single WASM search engine.
 * Only one WriteSession may be active at a time.
 */
export class IndexWriter {
    private active = false;

    constructor(
        private readonly searchFoundationEngine: Engine,
        private readonly blobStore: IndexBlobStore
    ) {}

    startWriteSession(): WriteSession {
        if (this.active) {
            throw new InvalidIndexerState('IndexWriter: a write session is already in progress');
        }
        // Guarded: a raw throw here would be a bare Error, which classifies as transient-`unknown`
        // and therefore as repairable - quarantining every node against a broken engine. Returning
        // `undefined` is the distinct, expected "write lock busy" case handled just below.
        const writer = engineCall('write', () => this.searchFoundationEngine.write());
        if (!writer) {
            throw new InvalidIndexerState('IndexWriter: Unable to get a write handle from an unactive write session');
        }
        this.active = true;
        return new WriteSession(writer, this.blobStore, () => {
            this.active = false;
        });
    }
}

function toValue(attr: AttributeValue): Value {
    switch (attr.kind) {
        case 'tag':
            return Value.tag(attr.value);
        case 'text':
            return Value.text(attr.value);
        case 'boolean':
            return Value.bool(attr.value);
        case 'integer':
            return Value.int(attr.value);
    }
}
