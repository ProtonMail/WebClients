import { Role } from '../../types';
import type { DriveDocument } from '../../types/documents';
import { DbApi } from '../../indexedDb/db';
import type { SearchResult, SearchServiceStatus, SearchState } from './types';

// Mirror worker message types to avoid drift
const WorkerMessageType = {
    Search: 0,
    Populate: 1,
    IndexConversation: 2,
    Status: 3,
} as const;

export class SearchService {
    private static instances: Map<string, SearchService> = new Map();
    private static defaultInstance: SearchService | null = null;
    // Keep the userId to allow per-user instances when needed
    private constructor(private readonly userId?: string) {
        if (userId) {
            this.ensureWorker();
        }
    }

    // In-memory drive documents indexed for search
    private driveDocuments: DriveDocument[] = [];
    private worker: Worker | null = null;
    private workerReady: Promise<void> | null = null;
    private pending = new Map<
        string,
        {
            resolve: (value: any) => void;
            reject: (reason?: any) => void;
        }
    >();
    private manifestReady: Promise<void> | null = null;
    private static readonly MANIFEST_BLOB = 'drive_manifest';

    private ensureWorker() {
        if (this.worker || !this.userId) return;
        try {
            this.worker = new Worker(new URL('../../workers/search/searchWorker.ts', import.meta.url), {
                type: 'module',
            });
            this.worker.onmessage = (event: MessageEvent) => {
                const { id } = event.data ?? {};
                if (!id) return;
                const pending = this.pending.get(id);
                if (pending) {
                    this.pending.delete(id);
                    pending.resolve(event.data);
                }
            };
            this.worker.onerror = (err) => {
                this.worker = null;
                this.workerReady = null;
                this.pending.forEach((p) => p.reject(err));
                this.pending.clear();
            };
            this.workerReady = Promise.resolve();
        } catch (error) {
            console.error('Failed to start search worker', error);
            this.worker = null;
            this.workerReady = null;
        }
    }

    private async postToWorker(message: any): Promise<any> {
        if (!this.userId) throw new Error('User ID required for search worker');
        this.ensureWorker();
        if (!this.worker || !this.workerReady) {
            throw new Error('Search worker unavailable');
        }
        await this.workerReady;
        const id = message.id ?? crypto.randomUUID();
        const payload = { ...message, id, userId: this.userId };
        const result = new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.worker!.postMessage(payload);
        });
        return result;
    }

    static get(userId?: string): SearchService {
        if (!userId) {
            if (!SearchService.defaultInstance) {
                SearchService.defaultInstance = new SearchService();
        }
            return SearchService.defaultInstance;
        }
        const existing = SearchService.instances.get(userId);
        if (existing) return existing;
        const created = new SearchService(userId);
        SearchService.instances.set(userId, created);
        return created;
    }

    private async loadManifest(): Promise<void> {
        if (!this.userId) return;
        const dbApi = new DbApi(this.userId);
        try {
            const blob = await dbApi.loadSearchBlob(SearchService.MANIFEST_BLOB);
            if (!blob) {
                // Manifest missing (e.g., IDB cleared) — drop in-memory cache
                this.driveDocuments = [];
                return;
            }

            const jsonString =
                typeof blob === 'string'
                    ? blob
                    : blob instanceof Uint8Array
                      ? new TextDecoder('utf-8').decode(blob)
                      : undefined;
            if (!jsonString) {
                this.driveDocuments = [];
                return;
            }

            const parsed = JSON.parse(jsonString) as DriveDocument[];
            if (Array.isArray(parsed)) {
                const encoder = new TextEncoder();
                this.driveDocuments = parsed.map((doc) => {
                    if (!doc.size && doc.content) {
                        try {
                            return { ...doc, size: encoder.encode(doc.content).byteLength };
                        } catch {
                            return { ...doc, size: 0 };
                        }
                    }
                    return doc;
                });
            } else {
                this.driveDocuments = [];
            }
        } catch (error) {
            console.warn('Failed to load drive manifest', error);
            this.driveDocuments = [];
        }
    }

    private async persistManifest(): Promise<void> {
        if (!this.userId) return;
        const dbApi = new DbApi(this.userId);
        try {
            await dbApi.saveSearchBlob(SearchService.MANIFEST_BLOB, JSON.stringify(this.driveDocuments));
        } catch (error) {
            console.warn('Failed to persist drive manifest', error);
        }
    }

    /**
     * Get all conversations (for default view)
     * @param state Redux state
     */
    async getAllConversations(state: SearchState): Promise<SearchResult[]> {
        const conversations = state.conversations;
        const spaces = state.spaces;
        const results: SearchResult[] = [];

        // Helper to get project info for a space
        const getProjectInfo = (spaceId: string): { projectName?: string; projectIcon?: string } => {
            const space = spaces[spaceId];
            if (space?.isProject) {
                return {
                    projectName: space.projectName,
                    projectIcon: space.projectIcon,
                };
            }
            return {};
        };

        // Convert all conversations to SearchResult format
        Object.values(conversations).forEach((conversation) => {
            const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId) : {};
            const timestamp = new Date(conversation.createdAt).getTime();

            results.push({
                type: 'conversation',
                conversationId: conversation.id,
                conversationTitle: conversation.title || 'Untitled',
                timestamp,
                ...projectInfo,
            });
        });

        // Sort by timestamp (newest first)
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Search using the foundation search full-text index (worker)
     * Returns conversation IDs sorted by relevance
     */
    private async searchWithWorker(query: string): Promise<[number, string][]> {
        if (!this.userId || !this.worker) {
            return [];
        }
        
        try {
            const response = await this.postToWorker({
                type: WorkerMessageType.Search,
                query,
            });
            
            if (response.error) {
                console.warn('[SearchService] Worker search error:', response.error);
                return [];
            }
            
            return response.results || [];
        } catch (error) {
            console.warn('[SearchService] Worker search failed:', error);
            return [];
        }
    }

    /**
     * Search conversations and messages
     * @param query Search query string
     * @param state Redux state to search in
     */
    async searchAsync(query: string, state: SearchState): Promise<SearchResult[]> {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) {
            return [];
        }

        const results: SearchResult[] = [];
        const conversations = state.conversations;
        const messages = state.messages;
        const spaces = state.spaces;

        // Helper to get project info for a space
        const getProjectInfo = (spaceId: string): { projectName?: string; projectIcon?: string } => {
            const space = spaces[spaceId];
            if (space?.isProject) {
                return {
                    projectName: space.projectName,
                    projectIcon: space.projectIcon,
                };
            }
            return {};
        };

        // Try foundation search first (full-text index)
        const workerResults = await this.searchWithWorker(normalizedQuery);
        const foundConversationIds = new Set<string>();
        
        if (workerResults.length > 0) {
            console.log('[SearchService] Foundation search returned', workerResults.length, 'results');
            
            // Map worker results (sorted by relevance) to SearchResult format
            for (const [_score, conversationId] of workerResults) {
                const conversation = conversations[conversationId];
                if (!conversation) continue;
                
                foundConversationIds.add(conversationId);
                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId) : {};
                const timestamp = new Date(conversation.createdAt).getTime();

                results.push({
                    type: 'conversation',
                    conversationId: conversation.id,
                    conversationTitle: conversation.title || 'Untitled',
                    timestamp,
                    ...projectInfo,
                });
            }
        }

        // Fallback: also do substring search for conversations not found by worker
        // (in case index is stale or worker failed)
        Object.values(conversations).forEach((conversation) => {
            if (foundConversationIds.has(conversation.id)) return; // Already found by worker
            
            const title = conversation.title?.toLowerCase() || '';
            if (title.includes(normalizedQuery)) {
                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId) : {};
                const timestamp = new Date(conversation.createdAt).getTime();

                results.push({
                    type: 'conversation',
                    conversationId: conversation.id,
                    conversationTitle: conversation.title || 'Untitled',
                    timestamp,
                    ...projectInfo,
                });
            }
        });

        // Search projects by name and description
        Object.values(spaces).forEach((space) => {
            if (!space.isProject) {
                return;
            }

            const projectName = space.projectName?.toLowerCase() || '';
            const projectDescription = space.projectInstructions?.toLowerCase() || '';
            
            if (projectName.includes(normalizedQuery) || projectDescription.includes(normalizedQuery)) {
                const timestamp = new Date(space.createdAt).getTime();

                results.push({
                    type: 'project',
                    projectId: space.id,
                    projectName: space.projectName || 'Untitled Project',
                    projectIcon: space.projectIcon,
                    projectDescription: space.projectInstructions,
                    timestamp,
                });
            }
        });

        // Search messages by content
        Object.values(messages).forEach((message) => {
            // Only search user and assistant messages (skip system/tool messages)
            if (message.role !== Role.User && message.role !== Role.Assistant) {
                return;
            }

            const content = message.content?.toLowerCase() || '';
            if (content.includes(normalizedQuery)) {
                const conversation = conversations[message.conversationId];
                if (!conversation) {
                    return;
                }

                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId) : {};
                const timestamp = new Date(message.createdAt).getTime();

                // Extract preview text (first 100 chars)
                const preview = message.content?.substring(0, 100) || '';

                results.push({
                    type: 'message',
                    conversationId: message.conversationId,
                    messageId: message.id,
                    conversationTitle: conversation.title || 'Untitled',
                    messagePreview: preview,
                    timestamp,
                    ...projectInfo,
                });
            }
        });

        // Remove duplicates (if a conversation matches both title and message, prefer conversation result)
        const seenConversations = new Set<string>();
        const deduplicated: SearchResult[] = [];

        // First pass: add conversation results
        results.forEach((result) => {
            if (result.type === 'conversation') {
                if (!seenConversations.has(result.conversationId)) {
                    seenConversations.add(result.conversationId);
                    deduplicated.push(result);
                }
            }
        });

        // Second pass: add message results only if we don't already have the conversation
        // Also add project and document results
        results.forEach((result) => {
            if (result.type === 'message') {
                // Skip if we already have a conversation result for this conversation
                if (!seenConversations.has(result.conversationId)) {
                    deduplicated.push(result);
                }
            } else if (result.type === 'project' || result.type === 'document') {
                deduplicated.push(result);
            }
        });

        // Search Drive documents (simple substring on name/path/content)
        this.driveDocuments.forEach((doc) => {
            const haystack = `${doc.name} ${doc.folderPath} ${doc.content}`.toLowerCase();
            if (haystack.includes(normalizedQuery)) {
                // Extract context snippet around the match in content
                let matchContext: string | undefined;
                if (doc.content) {
                    const contentLower = doc.content.toLowerCase();
                    const matchIndex = contentLower.indexOf(normalizedQuery);
                    if (matchIndex !== -1) {
                        const snippetRadius = 60; // characters before and after
                        const start = Math.max(0, matchIndex - snippetRadius);
                        const end = Math.min(doc.content.length, matchIndex + normalizedQuery.length + snippetRadius);
                        
                        let snippet = doc.content.slice(start, end);
                        // Add ellipsis if truncated
                        if (start > 0) snippet = '…' + snippet;
                        if (end < doc.content.length) snippet = snippet + '…';
                        
                        // Clean up whitespace
                        matchContext = snippet.replace(/\s+/g, ' ').trim();
                    }
                }
                
                deduplicated.push({
                    type: 'document',
                    documentId: doc.id,
                    documentName: doc.name,
                    documentPreview: doc.folderPath,
                    matchContext,
                    timestamp: doc.modifiedTime,
                });
            }
        });

        // Sort by timestamp (newest first)
        return deduplicated.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Placeholder for Drive document indexing
    async indexDocuments(documents: DriveDocument[]): Promise<{ success: boolean; error?: string }> {
        if (this.userId && !this.manifestReady) {
            this.manifestReady = this.loadManifest();
        }
        if (this.manifestReady) {
            await this.manifestReady;
        }

        const docsWithContent = documents.filter((d) => d.content && d.content.length);
        if (!docsWithContent.length) {
            return { success: false, error: 'No content to index' };
        }

        // Deduplicate by id; last write wins
        const remaining = this.driveDocuments.filter(
            (existing) => !docsWithContent.some((incoming) => incoming.id === existing.id)
        );
        this.driveDocuments = [...remaining, ...docsWithContent];
        await this.persistManifest();
        return { success: true };
    }

    async getDriveDocuments(): Promise<DriveDocument[]> {
        if (this.userId && !this.manifestReady) {
            this.manifestReady = this.loadManifest();
        }
        if (this.manifestReady) {
            await this.manifestReady;
        }
        // return a copy to avoid mutation
        return [...this.driveDocuments];
    }

    async clearDriveDocuments(): Promise<void> {
        this.driveDocuments = [];
        // Reset manifest promise so a future load will fetch fresh state
        this.manifestReady = null;
        if (this.userId) {
            const dbApi = new DbApi(this.userId);
            try {
                await dbApi.removeSearchBlob(SearchService.MANIFEST_BLOB);
            } catch (error) {
                console.warn('Failed to remove drive manifest', error);
            }
        }
    }

    removeDocument(documentId: string): void {
        const before = this.driveDocuments.length;
        this.driveDocuments = this.driveDocuments.filter((doc) => doc.id !== documentId);
        if (this.driveDocuments.length < before) {
            console.log('[SearchService] Removed document:', documentId);
            void this.persistManifest();
        }
    }

    removeDocumentsByFolder(folderId: string): void {
        this.driveDocuments = this.driveDocuments.filter((doc) => doc.folderId !== folderId);
        void this.persistManifest();
    }

    removeDocumentsBySpace(spaceId: string): void {
        this.driveDocuments = this.driveDocuments.filter((doc) => doc.spaceId !== spaceId);
        void this.persistManifest();
    }

    /**
     * Get a document by its ID (nodeUid for Drive files)
     */
    getDocumentById(documentId: string): DriveDocument | null {
        return this.driveDocuments.find((doc) => doc.id === documentId) || null;
    }

    /**
     * Get a document by its name (for file mentions)
     */
    getDocumentByName(name: string): DriveDocument | null {
        // Try exact match first
        const exactMatch = this.driveDocuments.find((doc) => doc.name === name);
        if (exactMatch) return exactMatch;

        // Try case-insensitive match
        const lowerName = name.toLowerCase();
        return this.driveDocuments.find((doc) => doc.name.toLowerCase() === lowerName) || null;
    }

    /**
     * Check if a document exists in the index by ID
     */
    hasDocument(documentId: string): boolean {
        return this.driveDocuments.some((doc) => doc.id === documentId);
    }

    // Placeholder status method; will be wired to worker when enabled
    async status(): Promise<SearchServiceStatus> {
        if (this.userId && !this.manifestReady) {
            this.manifestReady = this.loadManifest();
        }
        if (this.manifestReady) {
            await this.manifestReady;
        }

        const encoder = new TextEncoder();
        const totalBytes = this.driveDocuments.reduce((acc, doc) => {
            try {
                return acc + encoder.encode(doc.content || '').byteLength;
            } catch {
                return acc;
            }
        }, 0);

        // Prefer worker/IDB status when user is known
        if (this.userId) {
            const dbApi = new DbApi(this.userId);
            const status = await dbApi.checkFoundationSearchStatus();
            // If the store or entries are gone (e.g., IDB cleared), reset in-memory docs
            if (!status.tableExists || !status.hasEntries) {
                this.driveDocuments = [];
                this.manifestReady = null;
            }
            return {
                ...status,
                driveDocuments: this.driveDocuments.length,
            };
        }

        return Promise.resolve({
            tableExists: true,
            hasEntries: this.driveDocuments.length > 0,
            entryCount: this.driveDocuments.length,
            isEnabled: true,
            totalBytes,
            driveDocuments: this.driveDocuments.length,
        });
    }

    // Placeholder populate for conversations; to be wired to worker
    async populateEngine(conversations: Record<string, any>): Promise<void> {
        if (!this.userId) return;

        try {
            const response = await this.postToWorker({
                type: WorkerMessageType.Populate,
                conversations,
            });
            if (response?.success === false) {
                throw new Error(response?.error || 'Populate failed');
            }
        } catch (error) {
            console.error('Failed to populate search index via worker', error);
            throw error;
        }
    }
}

