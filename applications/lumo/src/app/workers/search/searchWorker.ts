import init, { enableTracing, setPanicHook } from '@proton/proton-foundation-search';

import { decryptUint8Array, encryptUint8Array } from '../../crypto';
import { DbApi } from '../../indexedDb/db';
import { SearchEngine } from './SearchEngine';
import { LumoCryptoAdapter } from './adapters/CryptoAdapter';
import { LumoDatabaseAdapter } from './adapters/DatabaseAdapter';

export enum MessageType {
    Search,
    Populate,
    IndexConversation,
    Status,
}

export interface SearchRequest {
    id: string;
    type: MessageType.Search;
    query: string;
    userId: string;
    searchIndexKey: string; // Unwrapped search index key
}

export interface PopulateRequest {
    id: string;
    type: MessageType.Populate;
    conversations: Record<string, any>;
    userId: string;
    searchIndexKey: string; // Unwrapped search index key
}

export interface PopulateResponse {
    id: string;
    type: MessageType.Populate;
    success: boolean;
    error?: string;
}

export interface Status {
    tableExists: boolean;
    hasEntries: boolean;
    entryCount: number;
}

export interface StatusRequest {
    id: string;
    type: MessageType.Status;
    userId: string;
    searchIndexKey: string; // Unwrapped search index key
}

export interface StatusResponse {
    id: string;
    type: MessageType.Status;
    status: Status;
}

export interface SearchResponse {
    id: string;
    type: MessageType.Search;
    results: [number, string][];
    error?: string;
    query: string;
}

export interface IndexConversationRequest {
    id: string;
    type: MessageType.IndexConversation;
    conversations: any[];
    userId: string;
    searchIndexKey: string; // Unwrapped search index key
}

export interface IndexConversationResponse {
    id: string;
    type: MessageType.IndexConversation;
    success: boolean;
    error?: string;
}

// Type guards
function isSearchRequest(item: any): item is SearchRequest {
    return item.type === MessageType.Search;
}

function isPopulateRequest(item: any): item is PopulateRequest {
    return item.type === MessageType.Populate;
}

function isIndexConversationRequest(item: any): item is IndexConversationRequest {
    return item.type === MessageType.IndexConversation;
}

function isStatusRequest(item: any): item is StatusRequest {
    return item.type === MessageType.Status;
}

// Global search engine instances per user
let searchEngine: SearchEngine | null = null;
let currentSearchIndexKey: string | null = null;

async function getSearchEngine(userId: string, searchIndexKey: string): Promise<SearchEngine | null> {
    if (!searchEngine || searchEngine.userId != userId) {
        const userDbApi = new DbApi(userId);
        await userDbApi.initialize();
        const cryptoAdapter = new LumoCryptoAdapter(
            encryptUint8Array as (data: Uint8Array<ArrayBuffer>, key: any, ad?: string) => Promise<string>,
            decryptUint8Array as (encrypted: string, key: any, ad: string) => Promise<Uint8Array<ArrayBuffer>>
        );
        const databaseAdapter = new LumoDatabaseAdapter(userDbApi);
        searchEngine = new SearchEngine(userId, cryptoAdapter, databaseAdapter);
        currentSearchIndexKey = null; // Reset key when creating new engine
    }

    // Update search index key if changed
    if (searchIndexKey && searchIndexKey !== currentSearchIndexKey) {
        searchEngine.setSearchIndexKey(searchIndexKey);
        currentSearchIndexKey = searchIndexKey;
    }

    return searchEngine;
}

async function status(userId: string, searchIndexKey: string): Promise<Status> {
    const searchEngine = await getSearchEngine(userId, searchIndexKey);
    if (!searchEngine) {
        return { tableExists: false, hasEntries: false, entryCount: 0 };
    }
    return searchEngine.getStatus();
}

async function postStatus(userId: string, searchIndexKey: string, id: string): Promise<void> {
    try {
        const currentStatus = await status(userId, searchIndexKey);

        const response: StatusResponse = {
            id,
            type: MessageType.Status,
            status: currentStatus,
        };

        console.log(`Search worker sending status response ${id} - success`);
        self.postMessage(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Search worker status error for message ${id}:`, errorMessage);

        // Send error response with default status
        const response: StatusResponse = {
            id,
            type: MessageType.Status,
            status: { tableExists: false, hasEntries: false, entryCount: 0 },
        };

        self.postMessage(response);
    }
}

// Handle messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
    console.log('Worker received a message', event.data);

    if (isPopulateRequest(event.data)) {
        // Handle populate requests
        await serialized(event.data.userId, () => populate(event.data));
    } else if (isIndexConversationRequest(event.data)) {
        // Handle indexing requests
        await serialized(event.data.userId, () => index(event.data));
    } else if (isStatusRequest(event.data)) {
        // Handle initial status requests with a cleanup
        await serialized(event.data.userId, () => cleanup(event.data));
    } else if (isSearchRequest(event.data)) {
        // Handle search requests immediately
        await immediately(() => search(event.data));
        return;
    }
});

let initialization: Promise<void> | undefined = initialize();
async function initialize() {
    await init();
    setPanicHook();
    enableTracing();
    initialization = undefined;
}
// adding initialization to the queue we ensure that all writes have init done.
const writeQueue: (() => Promise<void>)[] = [() => initialization!];
let writing: boolean = false;
/** Serializes the write work for the engine */
async function serialized(userId: string, task: () => Promise<void>) {
    writeQueue.push(task);

    if (writing) return;

    writing = true;
    try {
        while (writeQueue.length) {
            await navigator.locks.request(`search-indexing ${userId}`, async (_lock) => {
                const task = writeQueue.shift();
                if (!task) return;
                await task();
            });
        }
    } finally {
        writing = false;
    }
}
async function immediately(task: () => Promise<void>) {
    if (initialization) {
        // wait for wasm init
        await initialization;
    }
    await task();
}

async function search(request: SearchRequest) {
    const { id, query, userId, searchIndexKey } = request;
    console.log(`Search worker received search request ${id} with query: "${query}"`);

    if (!query) {
        console.warn(`Search worker got empty query`);
        return;
    }

    try {
        const searchEngine = await getSearchEngine(userId, searchIndexKey);
        if (!searchEngine) {
            throw new Error('Search engine not available');
        }
        const results = await searchEngine.performSearch(query);

        const response: SearchResponse = {
            id,
            type: MessageType.Search,
            results,
            query,
        };

        console.log(`Search worker sending response ${id} with ${results?.length} results`);
        self.postMessage(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if this is a query parsing error
        let userFriendlyError = errorMessage;
        let isComplexQueryError = false;

        if (
            errorMessage.includes('could not be fully parsed') ||
            errorMessage.includes('borrowed') ||
            errorMessage.includes('parse')
        ) {
            isComplexQueryError = true;
            userFriendlyError = `Complex search queries with operators and special characters are not yet supported.

Examples of unsupported operators:
• a/b (phrase search)
• a=b (exact match)
• a*a (wildcard search)

Examples of unsupported Unicode characters:
• Mathematical notation: (a₀, a₁, …, aₙ)
• Special symbols: …, «, », –, —
• Subscripts and superscripts

We're working on adding support for advanced search syntax and Unicode characters. For now, please try simpler search terms.`;
        }

        // Log as warning for complex query errors, error for actual issues
        if (isComplexQueryError) {
            console.warn(
                `Search worker warning for message ${id ?? ''}: Complex query parsing failed - ${errorMessage}`
            );
        } else {
            console.error(`Search worker error for message ${id ?? ''}:`, errorMessage);
        }

        const response: SearchResponse = {
            id,
            type: MessageType.Search,
            error: userFriendlyError,
            query,
            results: [],
        };

        self.postMessage(response);
    }
}

async function populate(request: PopulateRequest) {
    const { id, conversations, userId, searchIndexKey } = request;
    console.log(`Search worker received populate request ${id} for ${Object.keys(conversations).length} conversations`);

    try {
        const searchEngine = await getSearchEngine(userId, searchIndexKey);
        if (!searchEngine) {
            throw new Error('Search engine not available');
        }
        await searchEngine.populateEngine(conversations);

        const response: PopulateResponse = {
            id,
            type: MessageType.Populate,
            success: true,
        };

        console.log(`Search worker sending populate response ${id} - success`);
        self.postMessage(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Search worker populate error for message ${id}:`, errorMessage);

        const response: PopulateResponse = {
            id,
            type: MessageType.Populate,
            success: false,
            error: errorMessage,
        };

        self.postMessage(response);
    } finally {
        await postStatus(userId, searchIndexKey, id);
    }
}

async function index(request: IndexConversationRequest) {
    const { id, conversations, userId, searchIndexKey } = request;
    console.log(`Search worker received indexing request ${id} for conversation: ${conversations.length}`);

    try {
        const searchEngine = await getSearchEngine(userId, searchIndexKey);
        if (!searchEngine) {
            throw new Error('Search engine not available');
        }
        await searchEngine.indexConversations(conversations);

        const response: IndexConversationResponse = {
            id,
            type: MessageType.IndexConversation,
            success: true,
        };

        console.log(`Search worker sending indexing response ${id} - success`);
        self.postMessage(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Search worker indexing error for message ${id}:`, errorMessage);

        const response: IndexConversationResponse = {
            id,
            type: MessageType.IndexConversation,
            success: false,
            error: errorMessage,
        };

        self.postMessage(response);
    } finally {
        await postStatus(userId, searchIndexKey, id);
    }
}

async function cleanup(request: StatusRequest) {
    const { id, userId, searchIndexKey } = request;
    console.log(`Search worker received status request ${id}`);
    const searchEngine = await getSearchEngine(userId, searchIndexKey);
    if (!searchEngine) {
        throw new Error('Search engine not available');
    }
    await searchEngine.cleanup();
    await postStatus(userId, searchIndexKey, id);
}
