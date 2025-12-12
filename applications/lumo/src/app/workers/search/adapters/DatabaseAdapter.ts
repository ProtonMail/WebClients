// Database adapter interface for search operations
// This allows the search engine to be independent of specific database implementations
import type { DbApi } from '../../../indexedDb/db';

export interface SearchStatus {
    tableExists: boolean;
    hasEntries: boolean;
    entryCount: number;
}

export interface DatabaseAdapter {
    /**
     * Save a search blob with the given name and data
     */
    saveSearchBlob(name: string, data: Uint8Array<ArrayBuffer> | string): Promise<void>;

    /**
     * Load a search blob by name
     */
    loadSearchBlob(name: string): Promise<Uint8Array<ArrayBuffer> | string | null>;

    /**
     * Clear all search blobs
     */
    removeSearchBlob(name: string): Promise<void>;

    /**
     * Check the status of the search index
     */
    checkSearchStatus(): Promise<SearchStatus>;
}

// Lumo-specific implementation using existing IndexedDB utilities
export class LumoDatabaseAdapter implements DatabaseAdapter {
    constructor(private dbApi: DbApi) {} // DbApi type from indexedDb/db.ts

    async saveSearchBlob(name: string, data: Uint8Array<ArrayBuffer> | string): Promise<void> {
        return this.dbApi.saveSearchBlob(name, data);
    }

    async loadSearchBlob(name: string): Promise<Uint8Array<ArrayBuffer> | string | null> {
        const result = await this.dbApi.loadSearchBlob(name);
        return result as Uint8Array<ArrayBuffer> | string | null;
    }

    async removeSearchBlob(name: string): Promise<void> {
        return this.dbApi.removeSearchBlob(name);
    }

    async checkSearchStatus(): Promise<SearchStatus> {
        return this.dbApi.checkFoundationSearchStatus();
    }
}
