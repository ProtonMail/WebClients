import { ENABLE_FOUNDATION_SEARCH } from '../../config/search';
import type { AesGcmCryptoKey } from '../../crypto/types';
import { DbApi } from '../../indexedDb/db';
import { Role } from '../../types';
import type { DriveDocument } from '../../types/documents';
import { applyRetentionPolicy } from '../../ui/sidepanel/helpers';
import { BM25Index } from './bm25Index';
import { chunkDocument } from './documentChunker';
import type { SearchResult, SearchServiceStatus, SearchState } from './types';

import { getStoreRef } from '../../redux/storeRef';
import { selectMasterKey }  from '../../redux/selectors';

const WorkerMessageType = {
    Search: 0,
    Populate: 1,
    IndexConversation: 2,
    Status: 3,
} as const;

const buildSearchableText = (doc: DriveDocument, includeChunkTitle = false): string => {
    const chunkContext = includeChunkTitle && doc.chunkTitle ? ` [${doc.chunkTitle}]` : '';
    return `${doc.name}${chunkContext} ${doc.folderPath || ''} ${doc.content}`;
};

// TODO: looks like it can be replaced by SpaceMap in core/spaces.ts
type SpaceMap = Record<string, { isProject?: boolean; projectName?: string; projectIcon?: string }>;

const getProjectInfo = (spaceId: string, spaces: SpaceMap): { projectName?: string; projectIcon?: string } => {
    const space = spaces[spaceId];
    if (space?.isProject) {
        return { projectName: space.projectName, projectIcon: space.projectIcon };
    }
    return {};
};

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
    private static readonly SEARCH_INDEX_KEY_BLOB = 'search_index_key';
    // Search index key (unwrapped) for deriving the search DEK
    private searchIndexKey: string | null = null;
    // Cached DEK for BM25 index encryption
    private cachedSearchDek: AesGcmCryptoKey | null = null;
    // AD string for BM25 index blob encryption
    private static readonly BM25_INDEX_AD = 'lumo.search.blob.constant.bm25_index';

    /**
     * Get the master key from the Redux store.
     */
    private getMasterKey(): string | null {
        const store = getStoreRef();
        if (!store) return null;
        return selectMasterKey(store.getState());
    }

    /**
     * Get the search index key, generating and storing it if needed.
     * The search index key is wrapped with the master key and stored in IndexedDB.
     */
    async getSearchIndexKey(): Promise<string> {
        if (this.searchIndexKey) {
            return this.searchIndexKey;
        }

        const masterKey = this.getMasterKey();
        if (!this.userId || !masterKey) {
            throw new Error('User ID and master key required to get search index key');
        }

        const dbApi = new DbApi(this.userId);
        const {
            base64ToMasterKey,
            unwrapAesKey,
            cryptoKeyToBase64,
            generateSearchIndexKeyBase64,
            bytesToAesGcmCryptoKey,
            wrapAesKey,
        } = await import('../../crypto');

        // Try to load existing wrapped key
        const wrappedKeyBlob = await dbApi.loadSearchBlob(SearchService.SEARCH_INDEX_KEY_BLOB);
        const masterKeyObj = await base64ToMasterKey(masterKey);

        if (wrappedKeyBlob && typeof wrappedKeyBlob === 'string') {
            // Unwrap the existing key
            const wrappedKeyBytes = Uint8Array.fromBase64(wrappedKeyBlob);
            const unwrappedKey = await unwrapAesKey(wrappedKeyBytes, masterKeyObj, true);
            this.searchIndexKey = await cryptoKeyToBase64(unwrappedKey.encryptKey);
            return this.searchIndexKey;
        }

        // Generate a new search index key
        const newKeyBase64 = generateSearchIndexKeyBase64();
        const newKeyObj = await bytesToAesGcmCryptoKey(Uint8Array.fromBase64(newKeyBase64), true);

        // Wrap it with the master key
        const wrappedKeyBytes = await wrapAesKey(newKeyObj, masterKeyObj);
        const wrappedKeyBase64 = wrappedKeyBytes.toBase64();

        // Store the wrapped key
        await dbApi.saveSearchBlob(SearchService.SEARCH_INDEX_KEY_BLOB, wrappedKeyBase64);

        this.searchIndexKey = newKeyBase64;
        return this.searchIndexKey;
    }

    /**
     * Get or derive the DEK for encrypting/decrypting the BM25 index.
     * The DEK is derived from the search index key using HKDF.
     */
    private async getSearchDek(): Promise<AesGcmCryptoKey> {
        if (this.cachedSearchDek) {
            return this.cachedSearchDek;
        }

        const searchIndexKeyBase64 = await this.getSearchIndexKey();
        const { deriveSearchIndexDek } = await import('../../crypto');
        const searchIndexKeyBytes = Uint8Array.fromBase64(searchIndexKeyBase64);
        this.cachedSearchDek = await deriveSearchIndexDek(searchIndexKeyBytes);
        return this.cachedSearchDek;
    }

    private ensureWorker() {
        if (!ENABLE_FOUNDATION_SEARCH || this.worker || !this.userId) return;
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

        // Get or generate the search index key (this will get master key from store)
        const searchIndexKey = await this.getSearchIndexKey();

        this.ensureWorker();
        if (!this.worker || !this.workerReady) {
            throw new Error('Search worker unavailable');
        }
        await this.workerReady;
        const id = message.id ?? crypto.randomUUID();
        const payload = { ...message, id, userId: this.userId, searchIndexKey };
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

            let jsonString = undefined;

            if (typeof blob === 'string') {
                jsonString = blob;
            } else if (blob instanceof Uint8Array) {
                jsonString = new TextDecoder('utf-8').decode(blob);
            }

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
            const serialized = this.bm25Index.serialize();
            const { encryptUint8Array } = await import('../../crypto');
            const dek = await this.getSearchDek();
            const plaintextBytes = new TextEncoder().encode(serialized);
            const encryptedBase64 = await encryptUint8Array(plaintextBytes, dek, SearchService.BM25_INDEX_AD);
            await dbApi.saveSearchBlob(SearchService.BM25_INDEX_BLOB, encryptedBase64);
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

            // The blob should be an encrypted base64 string
            const encryptedBase64 = typeof blob === 'string' ? blob : undefined;
            if (!encryptedBase64) {
                console.warn('[SearchService] BM25 index blob is not a string, rebuilding');
                this.rebuildBM25Index();
                return;
            }

            const { decryptUint8Array } = await import('../../crypto');
            const dek = await this.getSearchDek();
            const decryptedBytes = await decryptUint8Array(encryptedBase64, dek, SearchService.BM25_INDEX_AD);
            const jsonString = new TextDecoder('utf-8').decode(decryptedBytes);

            this.bm25Index = BM25Index.deserialize(jsonString);
            console.log('[SearchService] Loaded BM25 index:', this.bm25Index.getStats());
        } catch (error) {
            console.warn('Failed to load BM25 index, rebuilding:', error);
            this.rebuildBM25Index();
        }
    }

    private rebuildBM25Index(): void {
        this.bm25Index = new BM25Index();
        for (const doc of this.driveDocuments) {
            if (doc.content) {
                this.bm25Index.addDocument(doc.id, buildSearchableText(doc));
            }
        }
    }

    async getAllConversations(state: SearchState, options?: { hasLumoPlus?: boolean }): Promise<SearchResult[]> {
        const { conversations, spaces } = state;

        // Apply retention policy (7-day limit for free users)
        const hasLumoPlus = options?.hasLumoPlus ?? true; // Default to Plus access if not specified
        const accessibleConversations = applyRetentionPolicy(Object.values(conversations), hasLumoPlus);

        const results: SearchResult[] = accessibleConversations.map((conversation) => {
            const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId, spaces) : {};
            const timestamp = new Date(conversation.createdAt).getTime();

            return {
                type: 'conversation',
                conversationId: conversation.id,
                conversationTitle: conversation.title || 'Untitled',
                timestamp,
                ...projectInfo,
            };
        });

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

    async searchAsync(query: string, state: SearchState, options?: { hasLumoPlus?: boolean }): Promise<SearchResult[]> {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) {
            return [];
        }

        const results: SearchResult[] = [];
        const { conversations, messages, spaces } = state;

        // Apply retention policy (7-day limit for free users)
        const hasLumoPlus = options?.hasLumoPlus ?? true; // Default to Plus access if not specified
        const accessibleConversations = applyRetentionPolicy(Object.values(conversations), hasLumoPlus);
        const accessibleConversationIds = new Set(accessibleConversations.map((c) => c.id));

        const workerResults = await this.searchWithWorker(normalizedQuery);
        const foundConversationIds = new Set<string>();

        if (workerResults.length > 0) {
            for (const [_score, conversationId] of workerResults) {
                const conversation = conversations[conversationId];
                if (!conversation || !accessibleConversationIds.has(conversationId)) continue;

                foundConversationIds.add(conversationId);
                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId, spaces) : {};
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

        accessibleConversations.forEach((conversation) => {
            if (foundConversationIds.has(conversation.id)) return;

            const title = conversation.title?.toLowerCase() || '';
            if (title.includes(normalizedQuery)) {
                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId, spaces) : {};
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

        Object.values(messages).forEach((message) => {
            if (message.role !== Role.User && message.role !== Role.Assistant) {
                return;
            }

            const content = message.content?.toLowerCase() || '';
            if (content.includes(normalizedQuery)) {
                const conversation = conversations[message.conversationId];
                if (!conversation) return;

                const projectInfo = conversation.spaceId ? getProjectInfo(conversation.spaceId, spaces) : {};
                const timestamp = new Date(message.createdAt).getTime();
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

        const docCandidates = this.driveDocuments
            .filter((doc) => doc.content)
            .map((doc) => ({
                id: doc.id,
                text: buildSearchableText(doc),
                doc,
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

        const processedDocs: DriveDocument[] = [];
        for (const doc of docsWithContent) {
            processedDocs.push(...chunkDocument(doc));
        }

        const incomingParentIds = new Set(docsWithContent.map((d) => d.id));

        const oldDocsToRemove = this.driveDocuments.filter((existing) => {
            const parentId = existing.parentDocumentId || existing.id;
            return incomingParentIds.has(parentId) || incomingParentIds.has(existing.id);
        });

        for (const oldDoc of oldDocsToRemove) {
            this.bm25Index.removeDocument(oldDoc.id, buildSearchableText(oldDoc));
        }

        const remaining = this.driveDocuments.filter((existing) => {
            const parentId = existing.parentDocumentId || existing.id;
            return !incomingParentIds.has(parentId) && !incomingParentIds.has(existing.id);
        });
        this.driveDocuments = [...remaining, ...processedDocs];

        for (const doc of processedDocs) {
            this.bm25Index.addDocument(doc.id, buildSearchableText(doc, true));
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
        return [...this.driveDocuments];
    }

    async clearDriveDocuments(): Promise<void> {
        this.driveDocuments = [];
        this.bm25Index.clear();
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
            this.bm25Index.removeDocument(doc.id, buildSearchableText(doc));
            this.driveDocuments = this.driveDocuments.filter((d) => d.id !== documentId);
            void this.persistManifest();
            void this.persistBM25Index();
        }
    }

    removeDocumentsByFolder(folderId: string): void {
        const docsToRemove = this.driveDocuments.filter((doc) => doc.folderId === folderId);
        for (const doc of docsToRemove) {
            this.bm25Index.removeDocument(doc.id, buildSearchableText(doc));
        }
        this.driveDocuments = this.driveDocuments.filter((doc) => doc.folderId !== folderId);
        void this.persistManifest();
        void this.persistBM25Index();
    }

    removeDocumentsBySpace(spaceId: string): void {
        const docsToRemove = this.driveDocuments.filter((doc) => doc.spaceId === spaceId);
        for (const doc of docsToRemove) {
            this.bm25Index.removeDocument(doc.id, buildSearchableText(doc));
        }
        this.driveDocuments = this.driveDocuments.filter((doc) => doc.spaceId !== spaceId);
        void this.persistManifest();
        void this.persistBM25Index();
    }

    /**
     * Reindex uploaded attachments (non-Drive files) for search.
     * This should be called on app initialization to ensure uploaded project files
     * are indexed for RAG retrieval.
     *
     * @param attachments - Array of attachments with spaceId (project attachments)
     * @returns Object with success status and count of indexed attachments
     */
    async reindexUploadedAttachments(
        attachments: {
            id: string;
            spaceId?: string;
            filename: string;
            mimeType?: string;
            rawBytes?: number;
            markdown?: string;
            uploadedAt: string;
            driveNodeId?: string;
        }[]
    ): Promise<{ success: boolean; indexed: number }> {
        if (this.userId && !this.manifestReady) {
            this.manifestReady = this.loadManifest();
        }
        if (this.manifestReady) {
            await this.manifestReady;
        }

        // Filter to only project attachments (have spaceId, have markdown, not from Drive)
        const projectAttachments = attachments.filter(
            (attachment) => attachment.spaceId && attachment.markdown && !attachment.driveNodeId
        );

        if (projectAttachments.length === 0) {
            console.log('[SearchService] No uploaded attachments to reindex');
            return { success: true, indexed: 0 };
        }

        console.log(`[SearchService] Reindexing ${projectAttachments.length} uploaded attachments`);

        let indexed = 0;
        for (const attachment of projectAttachments) {
            try {
                // Check if this attachment is already indexed
                const existingDoc = this.driveDocuments.find(
                    (doc) => doc.id === attachment.id || doc.parentDocumentId === attachment.id
                );

                if (existingDoc) {
                    console.log(`[SearchService] Attachment ${attachment.id} already indexed, skipping`);
                    continue;
                }

                // Create a DriveDocument from the attachment
                const document: DriveDocument = {
                    id: attachment.id,
                    name: attachment.filename,
                    content: attachment.markdown!,
                    mimeType: attachment.mimeType || 'application/octet-stream',
                    size: attachment.rawBytes || 0,
                    modifiedTime: new Date(attachment.uploadedAt).getTime(),
                    folderId: attachment.spaceId!, // Use spaceId as the folder
                    folderPath: 'Uploaded Files', // Virtual folder path for uploaded files
                    spaceId: attachment.spaceId!,
                };

                // Index the document (will chunk if large)
                const result = await this.indexDocuments([document]);
                if (result.success) {
                    indexed++;
                    console.log(`[SearchService] Indexed uploaded attachment: ${attachment.filename}`);
                }
            } catch (error) {
                console.warn(`[SearchService] Failed to index attachment ${attachment.id}:`, error);
            }
        }

        console.log(`[SearchService] Finished reindexing: ${indexed}/${projectAttachments.length} attachments indexed`);
        return { success: true, indexed };
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
                .filter((doc) => doc.parentDocumentId === documentId)
                .sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));

            if (allChunks.length > 0) {
                // Return a combined document
                return {
                    ...allChunks[0],
                    id: documentId,
                    content: allChunks.map((c) => c.content).join('\n\n'),
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
                content: chunks.map((c) => c.content).join('\n\n'),
                isChunk: false,
                parentDocumentId: undefined,
                chunkIndex: undefined,
                totalChunks: undefined,
            };
        }

        // Fallback: try case-insensitive match (non-chunked)
        const lowerName = name.toLowerCase();
        return this.driveDocuments.find((doc) => doc.name.toLowerCase() === lowerName && !doc.isChunk) || null;
    }

    /**
     * Check if a document exists in the index by ID
     */
    hasDocument(documentId: string): boolean {
        return this.driveDocuments.some((doc) => doc.id === documentId);
    }

    /**
     * Get all unique space IDs referenced by documents in the index
     * Used for diagnosing orphaned documents (documents referencing deleted spaces)
     */
    getReferencedSpaceIds(): Set<string> {
        const spaceIds = new Set<string>();
        for (const doc of this.driveDocuments) {
            if (doc.spaceId) {
                spaceIds.add(doc.spaceId);
            }
        }
        return spaceIds;
    }

    /**
     * Get documents that reference spaces not in the provided valid set
     * Returns orphaned documents grouped by space ID (counting unique documents, not chunks)
     */
    getOrphanedDocuments(validSpaceIds: Set<string>): {
        bySpace: Map<string, string[]>;
        totalDocs: number;
        totalChunks: number;
    } {
        const bySpace = new Map<string, Set<string>>();
        let totalChunks = 0;

        for (const doc of this.driveDocuments) {
            if (doc.spaceId && !validSpaceIds.has(doc.spaceId)) {
                totalChunks++;
                // Use parent document ID for chunks, or doc.id for non-chunks
                const docId = doc.parentDocumentId || doc.id;
                const existing = bySpace.get(doc.spaceId) || new Set<string>();
                existing.add(docId);
                bySpace.set(doc.spaceId, existing);
            }
        }

        // Convert Sets to Arrays and count unique docs
        const result = new Map<string, string[]>();
        let totalDocs = 0;
        for (const [spaceId, docIds] of bySpace) {
            result.set(spaceId, Array.from(docIds));
            totalDocs += docIds.size;
        }

        return { bySpace: result, totalDocs, totalChunks };
    }

    /**
     * Remove all orphaned documents (documents referencing spaces not in the valid set)
     * Returns the space IDs that had orphaned documents removed
     */
    async cleanupOrphanedDocuments(validSpaceIds: Set<string>): Promise<string[]> {
        const orphaned = this.getOrphanedDocuments(validSpaceIds);
        const orphanedSpaceIds = Array.from(orphaned.bySpace.keys());

        if (orphanedSpaceIds.length === 0) {
            return [];
        }

        console.log('[SearchService] Cleaning up orphaned documents:', {
            spaceIds: orphanedSpaceIds,
            totalDocs: orphaned.totalDocs,
            totalChunks: orphaned.totalChunks,
        });

        // Remove documents for each orphaned space
        for (const spaceId of orphanedSpaceIds) {
            this.removeDocumentsBySpace(spaceId);
        }

        // Persist changes
        await this.persistManifest();
        await this.persistBM25Index();

        console.log('[SearchService] Orphaned documents cleanup complete');
        return orphanedSpaceIds;
    }

    /**
     * Retrieve relevant documents for a query, filtered by spaceId (for RAG)
     * Used to automatically inject document context into prompts for projects
     *
     * @param query - The user's prompt/query
     * @param spaceId - The project spaceId to filter documents by
     * @param topK - Maximum number of documents to return (default 50)
     * @param minScore - Minimum relevance score threshold (default 0 - include all)
     * @returns Array of relevant documents with their content
     */
    async retrieveForRAG(
        query: string,
        spaceId: string,
        topK: number = 50,
        minScore: number = 0
    ): Promise<{ id: string; name: string; content: string; score: number }[]> {
        if (this.userId && !this.manifestReady) {
            this.manifestReady = this.loadManifest();
        }
        if (this.manifestReady) {
            await this.manifestReady;
        }

        const spaceDocuments = this.driveDocuments.filter(
            (doc) => doc.spaceId === spaceId && doc.content && doc.content.length > 0
        );

        if (spaceDocuments.length === 0) {
            return [];
        }

        const initialTopK = topK * 3;
        const effectiveTopK = Math.min(initialTopK, spaceDocuments.length);

        const candidates = spaceDocuments.map((doc) => ({
            id: doc.id,
            text: buildSearchableText(doc),
            doc,
        }));

        const rankedResults = this.bm25Index.rankDocuments(query, candidates, effectiveTopK, minScore);

        const docBestChunk = new Map<string, { doc: DriveDocument; score: number }>();

        for (const { document: candidate, score } of rankedResults) {
            const doc = candidate.doc;
            const parentId = doc.parentDocumentId || doc.id;
            const existing = docBestChunk.get(parentId);
            if (!existing || score > existing.score) {
                docBestChunk.set(parentId, { doc, score });
            }
        }

        const mergedResults = Array.from(docBestChunk.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        return mergedResults.map(({ doc, score }) => ({
            id: doc.parentDocumentId || doc.id,
            name: doc.name,
            content: doc.content,
            score,
            ...(doc.isChunk && {
                isChunk: true,
                chunkIndex: doc.chunkIndex,
                totalChunks: doc.totalChunks,
                chunkTitle: doc.chunkTitle,
            }),
        }));
    }

    formatRAGContext(
        documents: { name: string; content: string; score?: number }[],
        maxContextChars: number = 100000
    ): string {
        if (documents.length === 0) {
            return '';
        }

        const contextParts: string[] = [];
        let totalLength = 0;
        const headerFooterOverhead = 50;

        for (const doc of documents) {
            const docText = `--- Document: ${doc.name} ---\n${doc.content}`;
            const newLength = totalLength + docText.length + 4;

            if (totalLength > 0 && newLength + headerFooterOverhead > maxContextChars) {
                break;
            }

            contextParts.push(docText);
            totalLength = newLength;
        }

        if (contextParts.length === 0) {
            return '';
        }

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
        const chunks = this.driveDocuments.filter((doc) => doc.isChunk);
        const nonChunks = this.driveDocuments.filter((doc) => !doc.isChunk);
        const uniqueParentIds = new Set(chunks.map((doc) => doc.parentDocumentId));
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
