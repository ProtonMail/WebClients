import { Role } from '../../types';
import type { DriveDocument } from '../../types/documents';
import { DbApi } from '../../indexedDb/db';
import type { SearchResult, SearchServiceStatus, SearchState } from './types';
import { BM25Index } from './bm25Index';
import { chunkDocument, estimateTokens } from './documentChunker';

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
    // BM25 index for relevance-based ranking
    private bm25Index: BM25Index = new BM25Index();
    private static readonly BM25_INDEX_BLOB = 'bm25_index';
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
                this.bm25Index = new BM25Index();
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
                this.bm25Index = new BM25Index();
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
                // Load BM25 index after documents are loaded
                await this.loadBM25Index();
            } else {
                this.driveDocuments = [];
                this.bm25Index = new BM25Index();
            }
        } catch (error) {
            console.warn('Failed to load drive manifest', error);
            this.driveDocuments = [];
            this.bm25Index = new BM25Index();
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

    private async persistBM25Index(): Promise<void> {
        if (!this.userId) return;
        const dbApi = new DbApi(this.userId);
        try {
            await dbApi.saveSearchBlob(SearchService.BM25_INDEX_BLOB, this.bm25Index.serialize());
        } catch (error) {
            console.warn('Failed to persist BM25 index', error);
        }
    }

    private async loadBM25Index(): Promise<void> {
        if (!this.userId) return;
        const dbApi = new DbApi(this.userId);
        try {
            const blob = await dbApi.loadSearchBlob(SearchService.BM25_INDEX_BLOB);
            if (!blob) {
                // Index missing - rebuild from documents
                this.rebuildBM25Index();
                return;
            }

            const jsonString =
                typeof blob === 'string'
                    ? blob
                    : blob instanceof Uint8Array
                      ? new TextDecoder('utf-8').decode(blob)
                      : undefined;
            if (jsonString) {
                this.bm25Index = BM25Index.deserialize(jsonString);
                console.log('[SearchService] Loaded BM25 index:', this.bm25Index.getStats());
            } else {
                this.rebuildBM25Index();
            }
        } catch (error) {
            console.warn('Failed to load BM25 index, rebuilding:', error);
            this.rebuildBM25Index();
        }
    }

    private rebuildBM25Index(): void {
        this.bm25Index = new BM25Index();
        for (const doc of this.driveDocuments) {
            if (doc.content) {
                const searchableText = `${doc.name} ${doc.folderPath || ''} ${doc.content}`;
                this.bm25Index.addDocument(doc.id, searchableText);
            }
        }
        console.log('[SearchService] Rebuilt BM25 index:', this.bm25Index.getStats());
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
     * Sanitize query for the foundation search worker
     * Removes trailing boolean operators that would cause parse errors
     */
    private sanitizeWorkerQuery(query: string): string {
        // The worker interprets AND, OR, NOT as boolean operators
        // Remove trailing operators that would cause parse errors like "scala and"
        const sanitized = query
            .replace(/\s+(and|or|not)\s*$/i, '') // trailing "and", "or", "not"
            .trim();

        // If the entire query was just a boolean operator, return empty
        if (/^(and|or|not)$/i.test(sanitized)) {
            return '';
        }

        return sanitized;
    }

    /**
     * Search using the foundation search full-text index (worker)
     * Returns conversation IDs sorted by relevance
     */
    private async searchWithWorker(query: string): Promise<[number, string][]> {
        if (!this.userId || !this.worker) {
            return [];
        }

        // Sanitize query to avoid parse errors with boolean operators
        const sanitizedQuery = this.sanitizeWorkerQuery(query);
        if (!sanitizedQuery) {
            return [];
        }

        try {
            const response = await this.postToWorker({
                type: WorkerMessageType.Search,
                query: sanitizedQuery,
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

        // Search Drive documents using BM25 relevance ranking
        // This allows searching with sentences/paragraphs and finding relevant documents
        const docCandidates = this.driveDocuments
            .filter((doc) => doc.content)
            .map((doc) => ({
                id: doc.id,
                text: `${doc.name} ${doc.folderPath || ''} ${doc.content}`,
                doc, // Keep reference to original document
            }));

        if (docCandidates.length > 0) {
            // Use BM25 to rank documents by relevance
            const rankedDocs = this.bm25Index.rankDocuments(query, docCandidates, 50, 0.1);

            for (const { document: candidate, score } of rankedDocs) {
                const doc = candidate.doc as DriveDocument;

                // Extract context snippet - find the best matching part of content
                let matchContext: string | undefined;
                if (doc.content) {
                    // Get the most relevant terms from the query that exist in the document
                    const matchingTerms = this.bm25Index.getMatchingTerms(query);

                    if (matchingTerms.length > 0) {
                        // Find the first matching term in the content
                        const contentLower = doc.content.toLowerCase();
                        let bestMatchIndex = -1;

                        for (const term of matchingTerms) {
                            const idx = contentLower.indexOf(term);
                            if (idx !== -1 && (bestMatchIndex === -1 || idx < bestMatchIndex)) {
                                bestMatchIndex = idx;
                            }
                        }

                        if (bestMatchIndex !== -1) {
                            const snippetRadius = 80;
                            const start = Math.max(0, bestMatchIndex - snippetRadius);
                            const end = Math.min(doc.content.length, bestMatchIndex + snippetRadius);

                            let snippet = doc.content.slice(start, end);
                            if (start > 0) snippet = '…' + snippet;
                            if (end < doc.content.length) snippet = snippet + '…';

                            matchContext = snippet.replace(/\s+/g, ' ').trim();
                        }
                    }
                }

                deduplicated.push({
                    type: 'document',
                    documentId: doc.id,
                    documentName: doc.name,
                    documentPreview: doc.folderPath,
                    matchContext,
                    timestamp: doc.modifiedTime,
                    // Store score for sorting (we'll use it below)
                    _score: score,
                } as SearchResult & { _score?: number });
            }
        }

        // Sort: documents by relevance score, then by timestamp for others
        return deduplicated.sort((a, b) => {
            // Documents with scores should be sorted by score
            const aScore = (a as any)._score;
            const bScore = (b as any)._score;

            if (aScore !== undefined && bScore !== undefined) {
                return bScore - aScore; // Higher score first
            }
            if (aScore !== undefined) return -1; // Documents with scores first
            if (bScore !== undefined) return 1;

            // Fall back to timestamp for non-documents
            return b.timestamp - a.timestamp;
        });
    }

    // Index Drive documents for search
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

        // Chunk large documents into smaller, more searchable pieces
        const processedDocs: DriveDocument[] = [];
        let chunkedCount = 0;
        
        for (const doc of docsWithContent) {
            const chunks = chunkDocument(doc);
            if (chunks.length > 1) {
                chunkedCount++;
                console.log(`[SearchService] Chunked "${doc.name}" (${estimateTokens(doc.content)} tokens) into ${chunks.length} chunks`);
            }
            processedDocs.push(...chunks);
        }
        
        if (chunkedCount > 0) {
            console.log(`[SearchService] Chunked ${chunkedCount} large documents into ${processedDocs.length} total pieces`);
        }

        // Identify which documents are being updated
        const incomingParentIds = new Set(docsWithContent.map(d => d.id));
        
        // First remove old entries from BM25 (need to do this BEFORE updating driveDocuments)
        const oldDocsToRemove = this.driveDocuments.filter((existing) => {
            const parentId = existing.parentDocumentId || existing.id;
            return incomingParentIds.has(parentId) || incomingParentIds.has(existing.id);
        });
        
        for (const oldDoc of oldDocsToRemove) {
            const searchableText = `${oldDoc.name} ${oldDoc.folderPath || ''} ${oldDoc.content}`;
            this.bm25Index.removeDocument(oldDoc.id, searchableText);
        }
        
        // Now update driveDocuments - remove old, add new
        const remaining = this.driveDocuments.filter((existing) => {
            const parentId = existing.parentDocumentId || existing.id;
            return !incomingParentIds.has(parentId) && !incomingParentIds.has(existing.id);
        });
        this.driveDocuments = [...remaining, ...processedDocs];

        // Add new entries to BM25
        for (const doc of processedDocs) {
            // Include name and path in the searchable text
            // For chunks, also include the chunk title if available
            const chunkContext = doc.chunkTitle ? ` [${doc.chunkTitle}]` : '';
            const searchableText = `${doc.name}${chunkContext} ${doc.folderPath || ''} ${doc.content}`;
            this.bm25Index.addDocument(doc.id, searchableText);
        }

        await this.persistManifest();
        await this.persistBM25Index();
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
        this.bm25Index.clear();
        // Reset manifest promise so a future load will fetch fresh state
        this.manifestReady = null;
        if (this.userId) {
            const dbApi = new DbApi(this.userId);
            try {
                await dbApi.removeSearchBlob(SearchService.MANIFEST_BLOB);
                await dbApi.removeSearchBlob(SearchService.BM25_INDEX_BLOB);
            } catch (error) {
                console.warn('Failed to remove drive manifest/index', error);
            }
        }
    }

    removeDocument(documentId: string): void {
        const doc = this.driveDocuments.find((d) => d.id === documentId);
        if (doc) {
            // Remove from BM25 index
            const searchableText = `${doc.name} ${doc.folderPath || ''} ${doc.content}`;
            this.bm25Index.removeDocument(doc.id, searchableText);

            this.driveDocuments = this.driveDocuments.filter((d) => d.id !== documentId);
            console.log('[SearchService] Removed document:', documentId);
            void this.persistManifest();
            void this.persistBM25Index();
        }
    }

    removeDocumentsByFolder(folderId: string): void {
        const docsToRemove = this.driveDocuments.filter((doc) => doc.folderId === folderId);
        // Remove from BM25 index
        for (const doc of docsToRemove) {
            const searchableText = `${doc.name} ${doc.folderPath || ''} ${doc.content}`;
            this.bm25Index.removeDocument(doc.id, searchableText);
        }
        this.driveDocuments = this.driveDocuments.filter((doc) => doc.folderId !== folderId);
        void this.persistManifest();
        void this.persistBM25Index();
    }

    removeDocumentsBySpace(spaceId: string): void {
        const docsToRemove = this.driveDocuments.filter((doc) => doc.spaceId === spaceId);
        // Remove from BM25 index
        for (const doc of docsToRemove) {
            const searchableText = `${doc.name} ${doc.folderPath || ''} ${doc.content}`;
            this.bm25Index.removeDocument(doc.id, searchableText);
        }
        this.driveDocuments = this.driveDocuments.filter((doc) => doc.spaceId !== spaceId);
        void this.persistManifest();
        void this.persistBM25Index();
    }

    /**
     * Get a document by its ID (nodeUid for Drive files)
     */
    getDocumentById(documentId: string): DriveDocument | null {
        // Try exact ID match first
        const exactMatch = this.driveDocuments.find((doc) => doc.id === documentId);
        if (exactMatch) return exactMatch;
        
        // If not found, check if this is a parent ID and return the first chunk
        // This handles the case where we look up by parent ID after chunking
        const chunkMatch = this.driveDocuments.find((doc) => doc.parentDocumentId === documentId);
        if (chunkMatch) {
            // Return a "virtual" document representing the full content
            // by finding all chunks and combining them
            const allChunks = this.driveDocuments
                .filter(doc => doc.parentDocumentId === documentId)
                .sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
            
            if (allChunks.length > 0) {
                // Return a combined document
                return {
                    ...allChunks[0],
                    id: documentId,
                    content: allChunks.map(c => c.content).join('\n\n'),
                    isChunk: false,
                    parentDocumentId: undefined,
                    chunkIndex: undefined,
                    totalChunks: undefined,
                };
            }
        }
        
        return null;
    }

    /**
     * Get a document by its name (for file mentions)
     * For chunked documents, returns combined content from all chunks
     */
    getDocumentByName(name: string): DriveDocument | null {
        // Try exact match first (non-chunked documents)
        const exactMatch = this.driveDocuments.find((doc) => doc.name === name && !doc.isChunk);
        if (exactMatch) return exactMatch;
        
        // For chunked documents, find all chunks with this name and combine them
        const chunks = this.driveDocuments
            .filter((doc) => doc.name === name && doc.isChunk)
            .sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
        
        if (chunks.length > 0) {
            // Return a combined document
            return {
                ...chunks[0],
                id: chunks[0].parentDocumentId || chunks[0].id,
                content: chunks.map(c => c.content).join('\n\n'),
                isChunk: false,
                parentDocumentId: undefined,
                chunkIndex: undefined,
                totalChunks: undefined,
            };
        }
        
        // Fallback: try case-insensitive match (non-chunked)
        const lowerName = name.toLowerCase();
        return this.driveDocuments.find(
            (doc) => doc.name.toLowerCase() === lowerName && !doc.isChunk
        ) || null;
    }

    /**
     * Check if a document exists in the index by ID
     */
    hasDocument(documentId: string): boolean {
        return this.driveDocuments.some((doc) => doc.id === documentId);
    }

    /**
     * Retrieve relevant documents for a query, filtered by spaceId (for RAG)
     * Used to automatically inject document context into prompts for projects
     *
     * @param query - The user's prompt/query
     * @param spaceId - The project spaceId to filter documents by
     * @param topK - Maximum number of documents to return (default 5)
     * @param minScore - Minimum relevance score threshold (default 0 - include all)
     * @returns Array of relevant documents with their content
     */
    async retrieveForRAG(
        query: string,
        spaceId: string,
        topK: number = 5,
        minScore: number = 0
    ): Promise<{ id: string; name: string; content: string; score: number }[]> {
        console.log(`[SearchService] RAG: Starting retrieval for space ${spaceId}, query: "${query.slice(0, 50)}..."`);
        console.log(`[SearchService] RAG: Total documents in index: ${this.driveDocuments.length}`);

        if (this.userId && !this.manifestReady) {
            console.log('[SearchService] RAG: Loading manifest...');
            this.manifestReady = this.loadManifest();
        }
        if (this.manifestReady) {
            await this.manifestReady;
            console.log(`[SearchService] RAG: Manifest loaded, total documents: ${this.driveDocuments.length}`);
        }

        // Log all unique spaceIds in the index for debugging
        const uniqueSpaceIds = [...new Set(this.driveDocuments.map(d => d.spaceId))];
        console.log(`[SearchService] RAG: Unique spaceIds in index:`, uniqueSpaceIds);
        console.log(`[SearchService] RAG: Looking for spaceId:`, spaceId);

        // Log all documents with their spaceIds
        console.log(`[SearchService] RAG: All documents:`, this.driveDocuments.map(d => ({
            name: d.name,
            spaceId: d.spaceId,
            hasContent: !!(d.content && d.content.length > 0),
        })));

        // Filter documents by spaceId
        const spaceDocuments = this.driveDocuments.filter(
            (doc) => doc.spaceId === spaceId && doc.content && doc.content.length > 0
        );

        console.log(`[SearchService] RAG: Found ${spaceDocuments.length} documents for space ${spaceId}`);

        if (spaceDocuments.length === 0) {
            console.log('[SearchService] RAG: No documents found for space:', spaceId);
            return [];
        }

        // For chunks, we want to rank all chunks but then merge by parent document
        // Request more candidates initially to ensure we get best chunks from each doc
        const initialTopK = topK * 3; // Get more candidates for merging
        const effectiveTopK = Math.min(initialTopK, spaceDocuments.length);

        // Prepare candidates for BM25 ranking
        const candidates = spaceDocuments.map((doc) => ({
            id: doc.id,
            text: `${doc.name} ${doc.folderPath || ''} ${doc.content}`,
            doc,
        }));

        // Use BM25 to rank documents by relevance (minScore=0 to include all, then take topK)
        const rankedResults = this.bm25Index.rankDocuments(query, candidates, effectiveTopK, minScore);

        console.log(`[SearchService] RAG: Ranked ${rankedResults.length} candidates for query "${query.slice(0, 50)}..."`);

        // Merge chunks from the same parent document (keep best scoring chunk per document)
        const docBestChunk = new Map<string, { doc: DriveDocument; score: number }>();
        
        for (const { document: candidate, score } of rankedResults) {
            const doc = candidate.doc;
            // Use parentDocumentId for chunks, otherwise use the document id
            const parentId = doc.parentDocumentId || doc.id;
            
            const existing = docBestChunk.get(parentId);
            if (!existing || score > existing.score) {
                docBestChunk.set(parentId, { doc, score });
            }
        }
        
        // Convert to array and take top K documents (not chunks)
        const mergedResults = Array.from(docBestChunk.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        console.log(`[SearchService] RAG: After merging chunks, ${mergedResults.length} unique documents:`);
        mergedResults.forEach((r, i) => {
            const chunkInfo = r.doc.isChunk ? ` (chunk ${r.doc.chunkIndex}/${r.doc.totalChunks})` : '';
            console.log(`  [${i + 1}] ${r.doc.name}${chunkInfo} (score: ${r.score.toFixed(4)})`);
        });

        return mergedResults.map(({ doc, score }) => ({
            // Use parent document ID for consistent referencing
            id: doc.parentDocumentId || doc.id,
            name: doc.name,
            // Return chunk content (not full document) - this is more relevant to the query
            content: doc.content,
            score,
            // Include chunk metadata for display
            ...(doc.isChunk && {
                isChunk: true,
                chunkIndex: doc.chunkIndex,
                totalChunks: doc.totalChunks,
                chunkTitle: doc.chunkTitle,
            }),
        }));
    }

    /**
     * Format retrieved documents into a context string for the LLM prompt.
     * Documents are already sorted by relevance (highest first).
     * Will include as many documents as fit within the max context size.
     *
     * @param documents - Documents sorted by relevance score (highest first)
     * @param maxContextChars - Maximum characters for the entire context (default ~100k chars ≈ 25k tokens)
     */
    formatRAGContext(
        documents: { name: string; content: string; score?: number }[],
        maxContextChars: number = 100000
    ): string {
        if (documents.length === 0) {
            return '';
        }

        const contextParts: string[] = [];
        let totalLength = 0;
        const headerFooterOverhead = 50; // Approximate overhead for wrapper text

        for (const doc of documents) {
            const docText = `--- Document: ${doc.name} ---\n${doc.content}`;
            const newLength = totalLength + docText.length + 4; // +4 for "\n\n" separator

            // Check if adding this document would exceed the limit
            if (totalLength > 0 && newLength + headerFooterOverhead > maxContextChars) {
                console.log(`[RAG] Stopping at ${contextParts.length} documents (would exceed ${maxContextChars} char limit)`);
                break;
            }

            contextParts.push(docText);
            totalLength = newLength;
        }

        if (contextParts.length === 0) {
            return '';
        }

        console.log(`[RAG] Including ${contextParts.length}/${documents.length} documents (${totalLength} chars)`);
        return `[Relevant project documents for context:\n\n${contextParts.join('\n\n')}\n]`;
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

        const bm25Stats = this.bm25Index.getStats();
        
        // Count unique documents vs chunks
        const chunks = this.driveDocuments.filter(doc => doc.isChunk);
        const nonChunks = this.driveDocuments.filter(doc => !doc.isChunk);
        const uniqueParentIds = new Set(chunks.map(doc => doc.parentDocumentId));
        const uniqueDocCount = nonChunks.length + uniqueParentIds.size;

        // Prefer worker/IDB status when user is known
        if (this.userId) {
            const dbApi = new DbApi(this.userId);
            const status = await dbApi.checkFoundationSearchStatus();
            // If the store or entries are gone (e.g., IDB cleared), reset in-memory docs
            if (!status.tableExists || !status.hasEntries) {
                this.driveDocuments = [];
                this.bm25Index = new BM25Index();
                this.manifestReady = null;
            }
            return {
                ...status,
                driveDocuments: this.driveDocuments.length,
                driveDocumentsUnique: uniqueDocCount,
                driveChunks: chunks.length,
                bm25Stats: {
                    totalDocs: bm25Stats.totalDocs,
                    vocabularySize: bm25Stats.vocabularySize,
                    avgDocLength: bm25Stats.avgDocLength,
                },
            };
        }

        return Promise.resolve({
            tableExists: true,
            hasEntries: this.driveDocuments.length > 0,
            entryCount: this.driveDocuments.length,
            isEnabled: true,
            totalBytes,
            driveDocuments: this.driveDocuments.length,
            driveDocumentsUnique: uniqueDocCount,
            driveChunks: chunks.length,
            bm25Stats: {
                totalDocs: bm25Stats.totalDocs,
                vocabularySize: bm25Stats.vocabularySize,
                avgDocLength: bm25Stats.avgDocLength,
            },
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

