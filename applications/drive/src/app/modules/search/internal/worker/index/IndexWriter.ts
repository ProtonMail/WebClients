import type { Engine, Execution, Write } from '@proton/proton-foundation-search';
import { Document, Value, WriteEventKind } from '@proton/proton-foundation-search';

import { Logger } from '../../shared/Logger';
import { InvalidIndexerState, SearchLibraryError, sendErrorReportForSearch } from '../../shared/errors';
import type { AttributeValue, IndexEntry } from '../indexer/indexEntry';
import type { IndexBlobStore } from './IndexBlobStore';

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
            this.writer.free();
            this.writer = null;
            this.release();
            throw new SearchLibraryError('Search library WASM failed during insert', e);
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
            this.writer.free();
            this.writer = null;
            this.release();
            throw new SearchLibraryError('Search library WASM failed during remove', e);
        }
    }

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
        let execution: Execution;
        try {
            execution = this.writer.commit();
            // Commit consumer the writer, no need to free.
            this.writer = null;
        } catch (e) {
            this.writer?.free();
            this.writer = null;
            this.release();
            throw new SearchLibraryError('Search library WASM failed to commit', e);
        }

        try {
            let event;
            while ((event = execution.next()) !== undefined) {
                switch (event.kind()) {
                    case WriteEventKind.Load:
                        await this.blobStore.loadEvent(event);
                        break;
                    case WriteEventKind.Save:
                        await this.blobStore.saveEvent(event);
                        break;
                    case WriteEventKind.Stats:
                        event.free();
                        break;
                    default:
                        const error = new Error(`WriteSession: unexpected Write event kind <${event.kind()}>`);
                        Logger.error(error.message, error);
                        sendErrorReportForSearch(error);

                        event.free();
                        break;
                }
            }
        } finally {
            execution?.free();
            this.release();
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
        const writer = this.searchFoundationEngine.write();
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
