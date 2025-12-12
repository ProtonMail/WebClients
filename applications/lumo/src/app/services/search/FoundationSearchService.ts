import type { SearchEngine } from '../../workers/search/SearchEngine';


/**
 * Simple fallback search - searches conversation titles only
 * This is the graceful degradation when foundation search fails
 */
export class FallbackSearchEngine implements SearchEngine {
    private conversations: Map<string, Conversation> = new Map();
    private messages: Map<string, Message[]> = new Map();

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const {
            includeConversations = true,
            includeMessages = false,
            maxResults = 50,
        } = options;

        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return [];

        const results: SearchResult[] = [];

        // Search conversation titles
        if (includeConversations) {
            for (const [conversationId, conversation] of this.conversations) {
                if (conversation.title.toLowerCase().includes(normalizedQuery)) {
                    const conversationMessages = this.messages.get(conversationId) || [];
                    results.push({
                        type: 'conversation',
                        conversationId,
                        conversationTitle: conversation.title,
                        timestamp: new Date(conversation.createdAt).getTime(),
                        messageCount: conversationMessages.length,
                    });
                }
            }
        }

        // Search message content (simple substring match)
        if (includeMessages) {
            for (const [conversationId, messages] of this.messages) {
                const conversation = this.conversations.get(conversationId);
                if (!conversation) continue;

                for (const message of messages) {
                    if (
                        message.content &&
                        typeof message.content === 'string' &&
                        message.content.toLowerCase().includes(normalizedQuery)
                    ) {
                        // Create a preview with context around the match
                        const preview = this.createPreview(message.content, normalizedQuery);

                        results.push({
                            type: 'message',
                            messageId: message.id,
                            conversationId,
                            conversationTitle: conversation.title,
                            messageContent: message.content,
                            messagePreview: preview,
                            timestamp: new Date(message.createdAt).getTime(),
                        });
                    }
                }
            }
        }

        // Sort by timestamp (most recent first)
        results.sort((a, b) => b.timestamp - a.timestamp);

        return results.slice(0, maxResults);
    }

    async indexConversation(conversation: Conversation, messages: Message[]): Promise<void> {
        this.conversations.set(conversation.id, conversation);
        this.messages.set(conversation.id, messages);
    }

    async removeConversation(conversationId: string): Promise<void> {
        this.conversations.delete(conversationId);
        this.messages.delete(conversationId);
    }

    async clear(): Promise<void> {
        this.conversations.clear();
        this.messages.clear();
    }

    isReady(): boolean {
        return true; // Fallback is always ready
    }

    /**
     * Create a preview snippet with context around the search term
     */
    private createPreview(content: string, query: string, contextLength = 60): string {
        const lowerContent = content.toLowerCase();
        const index = lowerContent.indexOf(query);

        if (index === -1) return content.substring(0, contextLength) + '...';

        // Get context before and after the match
        const start = Math.max(0, index - contextLength / 2);
        const end = Math.min(content.length, index + query.length + contextLength / 2);

        let preview = content.substring(start, end);
        if (start > 0) preview = '...' + preview;
        if (end < content.length) preview = preview + '...';

        return preview;
    }
}


export class FoundationSearchService implements SearchEngine {
    private worker: Worker | null = null;
    private ready = false;
    private fallback = new FallbackSearchEngine();
    private initializationPromise: Promise<void> | null = null;
    private searchPromises = new Map<string, Promise<any>>();

    constructor() {
        this.initializationPromise = this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            // Dynamically import the search worker
            this.worker = new Worker(new URL('../../workers/search/searchWorker.ts', import.meta.url), {
                type: 'module',
            });

            // The existing worker doesn't send a READY message, so we'll assume it's ready
            // after a small delay. If operations fail, we'll fall back gracefully.
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    this.ready = true;
                    resolve();
                }, 100);
            });

            console.log('[SearchService] Foundation search worker loaded');
        } catch (error) {
            console.warn('[SearchService] Foundation search initialization failed, using fallback:', error);
            this.ready = false;
            this.worker = null;
        }
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        // Wait for initialization to complete
        await this.initializationPromise;

        // Use fallback if foundation search is not ready
        if (!this.ready || !this.worker) {
            console.log('[SearchService] Using fallback search');
            return this.fallback.search(query, options);
        }

        try {
            // Send search request to worker
            const requestId = Math.random().toString(36).substring(7);
            const promise = new Promise<SearchResult[]>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.searchPromises.delete(requestId);
                    reject(new Error('Search timeout'));
                }, 5000);

                const handler = (event: MessageEvent) => {
                    if (event.data.requestId === requestId) {
                        clearTimeout(timeout);
                        this.worker!.removeEventListener('message', handler);
                        this.searchPromises.delete(requestId);

                        if (event.data.type === 'SEARCH_RESULTS') {
                            resolve(event.data.results);
                        } else if (event.data.type === 'SEARCH_ERROR') {
                            reject(new Error(event.data.error));
                        }
                    }
                };

                this.worker!.addEventListener('message', handler);
            });

            this.searchPromises.set(requestId, promise);

            this.worker.postMessage({
                type: 'SEARCH',
                requestId,
                query,
                options,
            });

            return await promise;
        } catch (error) {
            console.warn('[SearchService] Foundation search failed, falling back:', error);
            return this.fallback.search(query, options);
        }
    }

    async indexConversation(conversation: Conversation, messages: Message[]): Promise<void> {
        // Always index in fallback for reliability
        await this.fallback.indexConversation(conversation, messages);

        // Wait for initialization
        await this.initializationPromise;

        if (!this.ready || !this.worker) {
            return;
        }

        try {
            this.worker.postMessage({
                type: 'INDEX_CONVERSATION',
                conversation,
                messages,
            });
        } catch (error) {
            console.warn('[SearchService] Failed to index in foundation search:', error);
        }
    }

    async removeConversation(conversationId: string): Promise<void> {
        await this.fallback.removeConversation(conversationId);

        await this.initializationPromise;

        if (!this.ready || !this.worker) {
            return;
        }

        try {
            this.worker.postMessage({
                type: 'REMOVE_CONVERSATION',
                conversationId,
            });
        } catch (error) {
            console.warn('[SearchService] Failed to remove from foundation search:', error);
        }
    }

    async clear(): Promise<void> {
        await this.fallback.clear();

        await this.initializationPromise;

        if (!this.ready || !this.worker) {
            return;
        }

        try {
            this.worker.postMessage({
                type: 'CLEAR',
            });
        } catch (error) {
            console.warn('[SearchService] Failed to clear foundation search:', error);
        }
    }

    isReady(): boolean {
        return this.ready || this.fallback.isReady();
    }

    /**
     * Check if foundation search is available (not just fallback)
     */
    isFoundationSearchReady(): boolean {
        return this.ready;
    }
}