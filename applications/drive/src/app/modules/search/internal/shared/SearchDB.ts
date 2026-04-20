import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';

import type { TreeEventScopeId } from './types';

const DB_VERSION = 1;

const dbName = (userId: string) => `search:${userId}`;

export interface TreeEventScopeSubscription {
    treeEventScopeId: TreeEventScopeId;
    lastEventId: string;
    lastEventIdTime: number;
}

export interface IndexPopulatorState {
    uid: string;
    done: boolean;
    generation: number;
    version: number;
}

interface SearchDBSchema extends DBSchema {
    indexBlobs: {
        key: [string, string]; // [indexKind, blobName]
        value: ArrayBuffer;
    };
    treeEventScopeSubscriptions: {
        key: TreeEventScopeId;
        value: TreeEventScopeSubscription;
    };
    indexPopulatorStates: {
        key: string;
        value: IndexPopulatorState;
    };
    userSettings: {
        key: string;
        value: boolean;
    };
}

type RawSearchDB = IDBPDatabase<SearchDBSchema>;

/**
 * Encapsulates all IndexedDB operations for the search module.
 * One database per user: "search:<userId>".
 * IndexedDB is the persistent store — IndexBlobStore reads from here with a pending-write buffer on top.
 */
export class SearchDB {
    private constructor(private readonly db: RawSearchDB) {}

    static async open(userId: string): Promise<SearchDB> {
        const db = await openDB<SearchDBSchema>(dbName(userId), DB_VERSION, {
            upgrade(database, oldVersion) {
                if (oldVersion < 1) {
                    database.createObjectStore('indexBlobs');
                    database.createObjectStore('treeEventScopeSubscriptions');
                    database.createObjectStore('indexPopulatorStates');
                    database.createObjectStore('userSettings');
                }
            },
        });
        return new SearchDB(db);
    }

    // --- Index blobs (keyed by [indexKind, blobName]) ---

    getIndexBlob(key: [string, string]): Promise<ArrayBuffer | undefined> {
        return this.db.get('indexBlobs', key);
    }

    putIndexBlob(key: [string, string], blob: ArrayBuffer): Promise<[string, string]> {
        return this.db.put('indexBlobs', blob, key);
    }

    deleteIndexBlob(key: [string, string]): Promise<void> {
        return this.db.delete('indexBlobs', key);
    }

    async getAllIndexBlobKeys(): Promise<[string, string][]> {
        return this.db.getAllKeys('indexBlobs');
    }

    // --- Tree event scope subscriptions ---

    getSubscription(treeEventScopeId: TreeEventScopeId): Promise<TreeEventScopeSubscription | undefined> {
        return this.db.get('treeEventScopeSubscriptions', treeEventScopeId);
    }

    getAllSubscriptions(): Promise<TreeEventScopeSubscription[]> {
        return this.db.getAll('treeEventScopeSubscriptions');
    }

    putSubscription(subscription: TreeEventScopeSubscription): Promise<TreeEventScopeId> {
        return this.db.put('treeEventScopeSubscriptions', subscription, subscription.treeEventScopeId);
    }

    deleteSubscription(treeEventScopeId: TreeEventScopeId): Promise<void> {
        return this.db.delete('treeEventScopeSubscriptions', treeEventScopeId);
    }

    // --- Index populator states ---

    getPopulatorState(uid: string): Promise<IndexPopulatorState | undefined> {
        return this.db.get('indexPopulatorStates', uid);
    }

    getAllPopulatorStates(): Promise<IndexPopulatorState[]> {
        return this.db.getAll('indexPopulatorStates');
    }

    putPopulatorState(state: IndexPopulatorState): Promise<string> {
        return this.db.put('indexPopulatorStates', state, state.uid);
    }

    deletePopulatorState(uid: string): Promise<void> {
        return this.db.delete('indexPopulatorStates', uid);
    }

    // --- User preferences ---

    async isOptedIn(): Promise<boolean> {
        const value = await this.db.get('userSettings', 'optIn');
        return value === true;
    }

    setOptedIn(): Promise<string> {
        return this.db.put('userSettings', true, 'optIn');
    }

    /**
     * Clear all data from every object store. The DB and connections remain open.
     *
     * We clear stores instead of deleting the DB because deleteDB blocks indefinitely
     * while any connection is open. Multiple connections can exist simultaneously
     * (SharedWorker + one per open tab), and coordinating their closure is non-trivial.
     * Clearing doesn't require closing connections and achieves the same result.
     */
    async clear(): Promise<void> {
        const storeNames = [...this.db.objectStoreNames];
        const tx = this.db.transaction(storeNames, 'readwrite');
        await Promise.all([...storeNames.map((name) => tx.objectStore(name).clear()), tx.done]);
    }

    close(): void {
        this.db.close();
    }
}
