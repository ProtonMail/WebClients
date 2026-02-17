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

// Search Engine class to encapsulate the core search logic
export class SearchEngine {
    private readonly engine: Engine;
    private readonly cache: Map<string, Cached>;

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
            console.log(`saveBlob: Successfully saved encrypted blob "${name}"`);
        } catch (error) {
            console.error(`saveBlob: Failed to encrypt/save blob "${name}"`, error);
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
                const b64 = await bufferToBase64(data);
                console.error(`Load event: send failed for "${name}" - ${b64}`);
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

    // Populate the engine with conversation data
    async populateEngine(conversations: Record<string, any>): Promise<void> {
        console.log('populateEngine called with', Object.keys(conversations).length, 'conversations');

        console.log('Starting engine population with single engine instance...');

        // Get write handle once for all conversations
        // caller must serialize writes
        const writer = this.engine.write();
        if (!writer) {
            throw new Error('Failed to get write handle - another write operation may be in progress');
        }
        console.log('Got write handle for population');

        let indexedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        try {
            // Index all conversations in a single engine instance
            for (const [conversationId, conversation] of Object.entries(conversations)) {
                if (!conversation || typeof conversation !== 'object') {
                    console.log(`Skipping invalid conversation: ${conversationId}`);
                    skippedCount++;
                    continue;
                }

                // Skip conversations that don't need indexing (not dirty and not new)
                if (conversation.dirty === false && conversation.status !== 'generating') {
                    console.log(`Skipping conversation ${conversationId} (not dirty and not generating)`);
                    skippedCount++;
                    continue;
                }

                try {
                    console.log(`Indexing conversation ${conversationId}...`);

                    // Create document for this conversation
                    const doc = new Document(conversation.id);

                    // Add conversation title/subject
                    if (conversation.title) {
                        const titleValue = Value.text(conversation.title);
                        doc.addAttribute('title', titleValue);
                    }

                    // Add conversation content from messages
                    if (conversation.messages && Array.isArray(conversation.messages)) {
                        const allMessages: string[] = [];
                        const userMessages: string[] = [];
                        const assistantMessages: string[] = [];

                        conversation.messages.forEach((msg: any) => {
                            if (msg.content && typeof msg.content === 'string') {
                                const content = msg.content.trim();
                                if (content) {
                                    allMessages.push(content);
                                    if (msg.role === 'user') {
                                        userMessages.push(content);
                                    } else if (msg.role === 'assistant') {
                                        assistantMessages.push(content);
                                    }
                                }
                            }
                        });

                        // Add all content as a single field
                        const allText = allMessages.join(' ');
                        if (allText) {
                            const contentValue = Value.text(allText);
                            doc.addAttribute('content', contentValue);
                        }

                        // Add user messages separately
                        if (userMessages.length > 0) {
                            const userText = userMessages.join(' ');
                            const userValue = Value.text(userText);
                            doc.addAttribute('usermessages', userValue);
                        }

                        // Add assistant messages separately
                        if (assistantMessages.length > 0) {
                            const assistantText = assistantMessages.join(' ');
                            const assistantValue = Value.text(assistantText);
                            doc.addAttribute('assistantmessages', assistantValue);
                        }
                    } else {
                        // No messages, add empty content
                        const contentValue = Value.text('');
                        doc.addAttribute('content', contentValue);
                    }

                    // Add other searchable fields
                    if (conversation.subject) {
                        const subjectValue = Value.text(conversation.subject);
                        doc.addAttribute('subject', subjectValue);
                    }

                    if (conversation.preview) {
                        const previewValue = Value.text(conversation.preview);
                        doc.addAttribute('preview', previewValue);
                    }

                    // Insert the document
                    writer.insert(doc);
                    console.log(`Document inserted for conversation: ${conversationId}`);
                    indexedCount++;
                } catch (error) {
                    console.error(`Failed to index conversation ${conversationId}:`, error);
                    errorCount++;
                    // Continue with other conversations even if one fails
                }
            }
        } catch (error) {
            // If anything fails before commit(), we need to free the writer explicitly
            writer.free();
            throw error;
        }

        // Commit all changes at once
        console.log('Committing all writer changes...');
        const execution = writer.commit();
        // Writer is consumed by commit()
        console.log('Writer committed, processing execution events...');

        try {
            // Handle execution events (Load/Save events)
            let saveEventCount = 0;
            let loadEventCount = 0;
            let totalEvents = 0;
            let event;
            while ((event = execution.next())) {
                totalEvents++;
                switch (event.kind()) {
                    case WriteEventKind.Save: {
                        saveEventCount++;
                        await this.saveEvent(event);
                        break;
                    }
                    case WriteEventKind.Load: {
                        loadEventCount++;
                        await this.loadEvent(event);
                        break;
                    }
                    default: {
                        console.error('Invalid write event', event.kind());
                        break;
                    }
                }
            }

            console.log(
                `Execution completed: ${totalEvents} total events, ${saveEventCount} saves, ${loadEventCount} loads`
            );
        } catch (executionError) {
            console.error('Error processing execution events:', executionError);
        } finally {
            // Free the execution object to release the write handle
            // This prevents "Failed to get write handle" errors
            execution.free();
        }

        console.log(`Population completed: ${indexedCount} indexed, ${skippedCount} skipped, ${errorCount} errors`);

        if (errorCount > 0) {
            console.warn(`Population completed with ${errorCount} errors`);
        }
    }

    async performSearch(query: string): Promise<[number, string][]> {
        console.log('performSearch called with query:', query);

        const queryBuilder = this.engine.query();

        // Create a comprehensive search query that searches across multiple fields
        console.log('Search expression:', query);

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
                    console.log(`Search found event ${found.length}: "${name}"`);
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

        // return most relevant entries first
        const results = found.map<[number, string]>((entry) => {
            entry = stats.updateScores(entry);
            return [entry.score().value(), entry.identifier()];
        });
        results.sort();
        results.reverse();
        return results;
    }

    // Index a single conversation
    async indexConversations(conversations: any[]): Promise<void> {
        console.log('indexConversations called for conversations:', conversations.length);

        try {
            // Get write handle
            // caller must serialize writes
            const writer = this.engine.write();
            if (!writer) {
                throw new Error('Failed to get write handle - another write operation may be in progress');
            }

            console.log('Got write handle, indexing conversation...');

            try {
                for (const conversation of conversations) {
                    // Create document for this conversation
                    const doc = new Document(conversation.id);

                    // Add conversation title/subject
                    if (conversation.title) {
                        const titleValue = Value.text(conversation.title);
                        doc.addAttribute('title', titleValue);
                    }

                    // Add message content indexing
                    if (conversation.messages && Array.isArray(conversation.messages)) {
                        console.log('Processing messages for indexing:', {
                            messageCount: conversation.messages.length,
                            messageDetails: conversation.messages.map((msg: any, index: number) => ({
                                index,
                                id: msg.id,
                                role: msg.role,
                                hasContent: !!(msg.content || msg.text),
                                contentLength: (msg.content || msg.text || '').length,
                                contentPreview: (msg.content || msg.text || '').substring(0, 50) + '...',
                                allFields: Object.keys(msg),
                            })),
                        });

                        const userMessages: string[] = [];
                        const assistantMessages: string[] = [];
                        const allMessages: string[] = [];

                        conversation.messages.forEach((msg: any) => {
                            const content = msg.content || msg.text || '';
                            console.log(`Processing message ${msg.id}:`, {
                                role: msg.role,
                                contentLength: content.length,
                                contentPreview: content.substring(0, 100),
                                hasContent: !!content,
                            });

                            if (content) {
                                allMessages.push(content);
                                if (msg.role === 'user') {
                                    userMessages.push(content);
                                } else if (msg.role === 'assistant') {
                                    assistantMessages.push(content);
                                }
                            }
                        });

                        console.log('Message processing results:', {
                            totalMessages: allMessages.length,
                            userMessages: userMessages.length,
                            assistantMessages: assistantMessages.length,
                            allTextLength: allMessages.join(' ').length,
                        });

                        // Add all content as a single field
                        const allText = allMessages.join(' ');
                        if (allText) {
                            const contentValue = Value.text(allText);
                            doc.addAttribute('content', contentValue);
                            console.log('Added content attribute with length:', allText.length);
                        } else {
                            console.log('No content to add - allText is empty');
                        }

                        // Add user messages separately
                        if (userMessages.length > 0) {
                            const userText = userMessages.join(' ');
                            const userValue = Value.text(userText);
                            doc.addAttribute('usermessages', userValue);
                            console.log('Added usermessages attribute with length:', userText.length);
                        }

                        // Add assistant messages separately
                        if (assistantMessages.length > 0) {
                            const assistantText = assistantMessages.join(' ');
                            const assistantValue = Value.text(assistantText);
                            doc.addAttribute('assistantmessages', assistantValue);
                            console.log('Added assistantmessages attribute with length:', assistantText.length);
                        }
                    } else {
                        console.log('No messages found in conversation');
                        const contentValue = Value.text('');
                        doc.addAttribute('content', contentValue);
                    }

                    // Add other searchable fields
                    if (conversation.subject) {
                        const subjectValue = Value.text(conversation.subject);
                        doc.addAttribute('subject', subjectValue);
                    }

                    if (conversation.preview) {
                        const previewValue = Value.text(conversation.preview);
                        doc.addAttribute('preview', previewValue);
                    }

                    // Insert the document
                    writer.insert(doc);
                    console.log('Document inserted for conversation:', conversation.id);
                }
            } catch (error) {
                // If anything fails before commit(), we need to free the writer explicitly
                writer.free();
                throw error;
            }

            // Commit the changes
            console.log('Committing writer changes...');
            const execution = writer.commit();
            // Writer is consumed by commit()
            console.log('Writer committed, processing execution events...');

            try {
                // Handle execution events (Load/Save events)
                let saveEventCount = 0;
                let loadEventCount = 0;
                let totalEvents = 0;
                let event;
                while ((event = execution.next())) {
                    totalEvents++;
                    switch (event.kind()) {
                        case WriteEventKind.Save: {
                            saveEventCount++;
                            await this.saveEvent(event);
                            break;
                        }
                        case WriteEventKind.Load: {
                            loadEventCount++;
                            await this.loadEvent(event);
                            break;
                        }
                        case WriteEventKind.Stats: {
                            const stats = event.stats();
                            console.log('Documents indexed: ', stats.documents);
                            break;
                        }
                        default: {
                            console.error('Invalid write event:', event.kind());
                            break;
                        }
                    }
                }

                console.log(
                    `Single conversation indexing completed: ${saveEventCount} saves, ${loadEventCount} loads, ${totalEvents} total events`
                );
            } finally {
                // Free the execution object to release the write handle
                // This prevents "Failed to get write handle" errors
                execution.free();
            }

            // Writer is consumed by commit()
        } catch (error) {
            console.error('Failed to index single conversation:', error);
            throw error;
        }
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

async function bufferToBase64(buffer: ArrayBuffer | Uint8Array<ArrayBuffer>): Promise<string> {
    const base64url = await new Promise<string>((r) => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result as string);
        reader.readAsDataURL(new Blob([buffer]));
    });
    return base64url.slice(base64url.indexOf(',') + 1);
}
