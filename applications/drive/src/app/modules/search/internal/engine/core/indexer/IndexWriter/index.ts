import type { Engine, Execution, Write } from '@proton/proton-foundation-search';
import { Document, SerDes, Value, WriteEventKind } from '@proton/proton-foundation-search';

import { Logger } from '../../../../Logger';
import { InvalidIndexerState, SearchLibraryError } from '../../../../errors';
import type { EngineDB } from '../../../storage/EngineDB';
import type { AttributeValue, IndexEntry } from '../types';

/**
 * An exclusive write session acquired from IndexWriter.startWriteSession().
 *
 * Holds a Write handle from the search library WASM for the duration of a
 * single batch. Callers chain insert() calls then await commit() to flush.
 *
 * This class is responsible for freeing the search library WASM handle in all
 * outcomes — whether insert or commit succeeds or throws. A release callback
 * is also provided to free the parent IndexWriter lock in case of an external
 * error so that a new session can be started.
 */
export class WriteSession {
    // Non-null while the search library WASM Write handle is alive.
    // Nulled immediately after free() or after commit() consumes it.
    // dispose() uses this as its idempotency guard.
    private writer: Write | null;

    constructor(
        writer: Write,
        private readonly db: EngineDB,
        private readonly configKey: string,
        private readonly release: () => void
    ) {
        this.writer = writer;
    }

    insert(entry: IndexEntry): this {
        if (this.writer === null) {
            throw new InvalidIndexerState("WriteSession: can't insert, session already released");
        }
        const writer = this.writer;
        try {
            const doc = new Document(entry.documentId);
            for (const attr of entry.attributes) {
                doc.addAttribute(attr.name, toValue(attr.value));
            }
            writer.insert(doc);
            return this;
        } catch (e) {
            // The search library WASM already freed the Write handle when it threw —
            // null it out to prevent a double-free, then release the IndexWriter lock.
            this.writer = null;
            this.release();
            throw new SearchLibraryError('Search library WASM failed during insert', e);
        }
    }

    /**
     * Discard all pending inserts and release the IndexWriter lock.
     * Safe to call multiple times — no-op if the session is already released.
     */
    dispose(): void {
        if (this.writer === null) {
            return;
        }
        this.writer.free();
        this.writer = null;
        this.release();
    }

    async commit(): Promise<void> {
        if (this.writer === null) {
            throw new InvalidIndexerState("WriteSession: can't commit, session already released");
        }
        const writer = this.writer;
        let execution: Execution;
        try {
            execution = writer.commit();
            // commit() consumed the Write handle — null it so dispose() won't double-free.
            this.writer = null;
        } catch (e) {
            writer.free();
            this.writer = null;
            this.release();
            throw new SearchLibraryError('Search library WASM failed to commit', e);
        }

        try {
            let event;
            while ((event = execution.next()) !== undefined) {
                switch (event.kind()) {
                    // Load events: the library requests blobs from the DB
                    case WriteEventKind.Load: {
                        const blobName = event.id().toString();
                        const stored = await this.db.getIndexBlob(this.configKey, blobName);
                        try {
                            if (stored !== undefined) {
                                event.send(SerDes.Cbor, new Uint8Array(stored)); // consumes event
                            } else {
                                event.sendEmpty(); // consumes event
                            }
                        } catch (e) {
                            throw new SearchLibraryError('Search library WASM failed to load index blob', e);
                        }
                        break;
                    }
                    // Save events: the library request new blobs to be persisted.
                    case WriteEventKind.Save: {
                        const blobName = event.id().toString();
                        const serialized = event.recv().serialize(SerDes.Cbor); // consumes event
                        await this.db.putIndexBlob(this.configKey, blobName, serialized.buffer as ArrayBuffer);
                        break;
                    }
                    case WriteEventKind.Stats:
                        event.free();
                        break;
                    default:
                        Logger.error(`WriteSession: unexpected Write event kind <${event.kind()}>`);
                        event.free();
                        break;
                }
            }
        } finally {
            execution.free();
            this.release();
        }
    }
}

/**
 * Issues exclusive WriteSession handles for a single WASM search engine.
 *
 * The WASM engine is owned by Engine.ts and injected here — IndexWriter
 * never constructs or destroys it. WASM is guaranteed ready by the time
 * IndexWriter is constructed (Engine.create() ensures this).
 *
 * Only one WriteSession may be active at a time. Calling startWriteSession()
 * while a session is open throws immediately.
 */
export class IndexWriter {
    private writer: Write | null = null;

    constructor(
        private readonly db: EngineDB,
        private readonly configKey: string,
        private readonly searchFoundationEngine: Engine
    ) {}

    startWriteSession(): WriteSession {
        if (this.writer) {
            throw new InvalidIndexerState('IndexWriter: a write session is already in progress');
        }
        const writer = this.searchFoundationEngine.write();
        if (!writer) {
            throw new SearchLibraryError('IndexWriter: search library WASM engine failed to open a write handle');
        }
        this.writer = writer;
        return new WriteSession(writer, this.db, this.configKey, () => {
            this.writer = null;
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
