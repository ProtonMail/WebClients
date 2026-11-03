import {
    type Cached,
    type CleanupEvent,
    CleanupEventKind,
    CollectionStats,
    Document,
    Engine,
    type FoundEntry,
    type QueryEvent,
    QueryEventKind,
    SerDes,
    Value,
    type WriteEvent,
    WriteEventKind,
} from '@proton/proton-foundation-search';

import type { CryptoAdapter } from './adapters/CryptoAdapter';
import type { DatabaseAdapter, SearchStatus } from './adapters/DatabaseAdapter';
import { SEARCH_BLOB_VERSION_KEY, SEARCH_LIBRARY_BLOB_VERSION } from './config';

/**
 * Which chats the engine holds, and at which fingerprint. An engine blob in all but name, so it is
 * wiped with them on a format reset and never says a chat is indexed when it isn't.
 */
const CONVERSATION_MANIFEST_BLOB = 'conversation_manifest';

export type IndexableConversation = {
    id: string;
    title: string;
    /** Text of the chat's user and assistant messages, oldest first. */
    messages: { role: 'user' | 'assistant'; content: string }[];
    /** Changes whenever the indexed text does, so unchanged chats are skipped. */
    fingerprint: string;
};

/** Every attribute is always written: insert keeps attributes a document leaves out. */
function toDocument({ id, title, messages }: IndexableConversation): Document {
    const textOf = (role?: 'user' | 'assistant') =>
        messages
            .filter((message) => !role || message.role === role)
            .map((message) => message.content)
            .join(' ');
    const doc = new Document(id);
    doc.addAttribute('title', Value.text(title));
    doc.addAttribute('content', Value.text(textOf()));
    doc.addAttribute('usermessages', Value.text(textOf('user')));
    doc.addAttribute('assistantmessages', Value.text(textOf('assistant')));
    return doc;
}

// Search Engine class to encapsulate the core search logic
export class SearchEngine {
    private readonly engine: Engine;
    private readonly cache: Map<string, Cached>;
    private conversationManifest: Record<string, string> | null = null;

    constructor(
        public readonly userId: string,
        private cryptoAdapter: CryptoAdapter,
        private databaseAdapter: DatabaseAdapter
    ) {
        // wasm init is done by the caller (worker)
        this.engine = Engine.builder().build();
        // in-memory blob cache for the engine
        this.cache = new Map();
    }

    // Helper function to create additional data string for search blob encryption
    private getSearchBlobAd(blobName: string): string {
        const ad = `lumo.search.blob.constant.${blobName}`;

        console.log(`getSearchBlobAd: "${blobName}" -> AD: "${ad}"`);

        return ad;
    }

    /**
     * Rebuild the index when it was written by an engine with a different blob format.
     *
     * The engine cannot read a blob written by an older version — `send()` throws and
     * there is no way back — so a version mismatch has to be caught before the first
     * read. Wiping is safe: conversations are re-indexed from Redux on the next populate,
     * and the blobs Lumo owns (project file search) are preserved.
     */
    async ensureCompatibleBlobFormat(): Promise<void> {
        const storedVersion = await this.databaseAdapter.loadSearchBlob(SEARCH_BLOB_VERSION_KEY);

        if (storedVersion === SEARCH_LIBRARY_BLOB_VERSION) {
            return;
        }

        if (storedVersion !== null) {
            console.log(
                `[Search] Index blob format "${String(storedVersion)}" does not match "${SEARCH_LIBRARY_BLOB_VERSION}"; rebuilding index`
            );
        }

        await this.databaseAdapter.clearEngineBlobs();
        await this.databaseAdapter.saveSearchBlob(SEARCH_BLOB_VERSION_KEY, SEARCH_LIBRARY_BLOB_VERSION);
    }

    /**
     * Set the search index key for deriving the search index DEK.
     * The search index key should be unwrapped from storage using the master key.
     * Must be called before any encryption/decryption operations.
     */
    setSearchIndexKey(searchIndexKeyBase64: string): void {
        this.cryptoAdapter.setSearchIndexKey(searchIndexKeyBase64);
    }

    // Helper function to get a consistent DEK for all search blobs
    // This ensures all search blobs use the same encryption key derived from the search index key
    private async getSearchDek(): Promise<CryptoKey> {
        return this.cryptoAdapter.deriveSearchDek();
    }

    private loadCache(name: string): Cached | undefined {
        return this.cache.get(name);
    }
    private saveCache(name: string, cached: Cached) {
        this.cache.set(name, cached);
    }
    private removeCache(name: string) {
        this.cache.delete(name);
    }

    private async loadBlob(name: string): Promise<Uint8Array<ArrayBuffer> | undefined> {
        const blobEncrypted = await this.databaseAdapter.loadSearchBlob(name);

        if (blobEncrypted === null) {
            console.log(`loadBlob: No encrypted blob found for "${name}"`);
            return undefined;
        }

        const ad = this.getSearchBlobAd(name);
        console.log(`loadBlob: Attempting to decrypt blob "${name}" with AD "${ad}"`);

        try {
            // Use DEK derived from search index key
            const dek = await this.getSearchDek();
            const decrypted = await this.cryptoAdapter.decrypt(blobEncrypted, dek, ad);
            console.log(`loadBlob: Successfully decrypted blob "${name}" (${decrypted.length} bytes)`);
            return decrypted as Uint8Array<ArrayBuffer>;
        } catch (error) {
            console.error(`loadBlob: Failed to decrypt blob "${name}" with AD "${ad}":`, error);
            throw error;
        }
    }

    private async saveBlob(name: string, blobDecrypted: Uint8Array<ArrayBuffer>): Promise<void> {
        const ad = this.getSearchBlobAd(name);
        console.log(`saveBlob: Encrypting blob "${name}" with AD "${ad}" (${blobDecrypted.length} bytes)`);

        try {
            // Use DEK derived from search index key
            const dek = await this.getSearchDek();
            const blobEncrypted = await this.cryptoAdapter.encrypt(blobDecrypted, dek, ad);
            await this.databaseAdapter.saveSearchBlob(name, blobEncrypted);
            console.log(`saveBlob: Successfully saved encrypted blob "${name}"`);
        } catch (error) {
            console.error(`saveBlob: Failed to encrypt/save blob "${name}" with AD "${ad}":`, error);
            throw error;
        }
    }

    private async removeBlob(name: string): Promise<void> {
        try {
            // Use consistent search key instead of space-specific key
            await this.databaseAdapter.removeSearchBlob(name);
            console.log(`removeBlob: Successfully saved encrypted blob "${name}"`);
        } catch (error) {
            console.error(`removeBlob: Failed to encrypt/save blob "${name}"`, error);
            throw error;
        }
    }

    private async loadEvent(event: QueryEvent | WriteEvent | CleanupEvent) {
        const name = event.id().toString();
        const cached = this.loadCache(name);
        if (cached) {
            event.sendCached(cached);
        } else {
            const data = await this.loadBlob(name);
            if (!data) {
                event.sendEmpty();
                return;
            }
            try {
                event.send(SerDes.Cbor, data);
            } catch (x) {
                console.error(`Load event: send failed for "${name}" (${data.length} bytes)`);
                throw x;
            }
            console.log(`Load event: loading blob "${name}" (${data.length} bytes)`);
        }
    }

    private async saveEvent(event: WriteEvent | CleanupEvent) {
        const name = event.id().toString();
        const blob = event.recv();
        const data = blob.serialize(SerDes.Cbor);
        console.log(`Save event: storing blob "${name}" (${data.length} bytes)`);
        await this.saveBlob(name, data as Uint8Array<ArrayBuffer>);
        this.saveCache(name, blob);
    }

    private async releaseEvent(event: CleanupEvent) {
        const name = event.id().toString();
        console.log(`Release event: removing blob "${name}"`);
        this.removeCache(name);
        await this.removeBlob(name);
    }

    async performSearch(query: string): Promise<[number, string][]> {
        const queryBuilder = this.engine.query();

        // Create a comprehensive search query that searches across multiple fields
        const search = queryBuilder.withStringExpression(query).search();
        const found: FoundEntry[] = [];
        const stats = new CollectionStats();

        let loadEventCount = 0;
        let statEventCount = 0;

        let queryEvent;
        while ((queryEvent = search.next())) {
            switch (queryEvent.kind()) {
                case QueryEventKind.Load: {
                    loadEventCount++;
                    await this.loadEvent(queryEvent);
                    break;
                }
                case QueryEventKind.Found: {
                    console.log(`Search found event ${found.length}"`);
                    const entry = queryEvent.found();
                    if (entry) found.push(entry);
                    break;
                }
                case QueryEventKind.Stats: {
                    statEventCount++;
                    const news = queryEvent.stats();
                    if (news) stats.merge(news);
                    break;
                }
                default: {
                    console.error('Invalid query event:', queryEvent.kind());
                    break;
                }
            }
        }

        console.log(`Search completed: ${loadEventCount} loads, ${statEventCount} stats, ${found.length} found`);

        // BM25-harmonize the raw per-shard scores against the collection stats. `rank`
        // also orders the entries most-relevant-first, breaking ties by identifier.
        return stats.rank(found).map<[number, string]>((entry) => [entry.score().value(), entry.identifier()]);
    }

    /** Fingerprint of every indexed chat, by conversation id. */
    async getIndexedConversations(): Promise<Record<string, string>> {
        if (!this.conversationManifest) {
            try {
                const blob = await this.loadBlob(CONVERSATION_MANIFEST_BLOB);
                this.conversationManifest = blob ? JSON.parse(new TextDecoder().decode(blob)) : {};
            } catch (error) {
                // Unreadable: every chat is indexed again, which overwrites what the engine holds.
                console.warn('Conversation manifest could not be read; re-indexing all chats', error);
                this.conversationManifest = {};
            }
        }
        return this.conversationManifest!;
    }

    /** Index or re-index chats and drop removed ones, then record what the index now holds. */
    async indexConversations(conversations: IndexableConversation[], removedIds: string[]): Promise<void> {
        const manifest = await this.getIndexedConversations();

        // caller must serialize writes
        const writer = this.engine.write();
        if (!writer) {
            throw new Error('Failed to get write handle - another write operation may be in progress');
        }

        try {
            removedIds.forEach((id) => writer.remove(id));
            conversations.forEach((conversation) => writer.insert(toDocument(conversation)));
        } catch (error) {
            // If anything fails before commit(), we need to free the writer explicitly
            writer.free();
            throw error;
        }

        const execution = writer.commit();
        try {
            let event;
            while ((event = execution.next())) {
                switch (event.kind()) {
                    case WriteEventKind.Save:
                        await this.saveEvent(event);
                        break;
                    case WriteEventKind.Load:
                        await this.loadEvent(event);
                        break;
                    case WriteEventKind.Stats:
                        break;
                    default:
                        console.error('Invalid write event:', event.kind());
                }
            }
        } finally {
            execution.free();
        }

        removedIds.forEach((id) => delete manifest[id]);
        conversations.forEach(({ id, fingerprint }) => (manifest[id] = fingerprint));
        await this.saveBlob(
            CONVERSATION_MANIFEST_BLOB,
            new TextEncoder().encode(JSON.stringify(manifest)) as Uint8Array<ArrayBuffer>
        );
        console.log(`Indexed ${conversations.length} chats, removed ${removedIds.length}`);
    }

    async getStatus(): Promise<SearchStatus> {
        return this.databaseAdapter.checkSearchStatus();
    }

    async cleanup() {
        const cleanup = this.engine.cleanup();
        if (!cleanup) {
            throw new Error('Failed to get cleanup write handle - another write operation may be in progress');
        }

        try {
            let event;
            while ((event = cleanup.next())) {
                switch (event.kind()) {
                    case CleanupEventKind.Load: {
                        await this.loadEvent(event);
                        break;
                    }
                    case CleanupEventKind.Save: {
                        await this.saveEvent(event);
                        break;
                    }
                    case CleanupEventKind.Release: {
                        await this.releaseEvent(event);
                        break;
                    }
                    default: {
                        console.error('Invalid cleanup event:', event.kind());
                        break;
                    }
                }
            }
        } finally {
            cleanup.free();
        }
    }
}
