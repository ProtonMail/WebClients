import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';

import type { BFSVisitorState } from '../worker/indexer/utils/resumableTreeVisitor/ResumableFolderBFSVisitor';
import { computeBackoff } from './errors';
import type { IndexKind, IndexingProgress, TreeEventScopeId } from './types';

const DB_VERSION = 3;

const dbName = (userId: string) => `search:${userId}`;

export interface TreeEventScopeSubscription {
    treeEventScopeId: TreeEventScopeId;
    lastEventId: string;
    lastEventIdTime: number;
}

export interface IndexPopulatorState {
    uid: string;
    indexKind: IndexKind;
    indexPopulatorKind: string;
    treeEventScopeId: TreeEventScopeId;
    generation: number;
    version: number;
    done: boolean;
    progress: IndexingProgress;
    // Monotonic counter handing out one epoch per subtree re-index run for this populator.
    // Optional for backward-compat with rows written before the feature (treated as 0).
    subtreeReindexEpoch?: number;
    // Sticky "initial indexing has already failed at least once", so the isInitialAttempt metric
    // survives a worker restart (the in-memory retry counter driving backoff does not). Set on the
    // first failure, cleared once a run succeeds.
    // Must NOT be reset by markAsNotDone, which re-fires on every retry while the persisted version
    // is stale - see the regression test in MyFilesIndexPopulator.test.ts.
    initialIndexingFailed?: boolean;
    // Last-known total document count for this populator's index kind, persisted so it survives
    // worker restarts. Read by the eviction trigger to decide whether a sweep is needed.
    documentCount?: number;
    // Sticky "this populator's index hit SEARCH_MAX_INDEXED_DOCUMENTS" - either the initial walk
    // stopped early, or an eviction sweep has removed entries. Cleared only by markAsNotDone (a
    // fresh indexing campaign gets a fresh verdict); never cleared by document count dropping back
    // down, since that does not mean the index is complete again.
    capped?: boolean;
    // Epoch-ms of the last completed eviction sweep for this populator's index kind, used to space
    // sweeps at least SEARCH_EVICTION_MIN_INTERVAL_MS apart.
    lastEvictionAt?: number;
}

/** The index operation a repair entry must replay when its node is reprocessed:
 * index = re-fetch + upsert + re-index subtree for a folder
 * remove = remove node + descendants
 */
export type RepairOperation = 'index' | 'remove';

/**
 * A node whose indexing failed with a non-systemic (node-scoped) error and was skipped so the
 * rest of the batch could proceed. Recorded in the `repairEntries` store, keyed by
 * `[indexKind, nodeUid]` so a later event for the same node coalesces (last write wins).
 * Retried independently by RepairFailedNodesTask once `nextAttemptAt` has elapsed.
 */
export interface RepairNodeEntry {
    nodeUid: string;
    indexKind: IndexKind;
    // The populator that owns this node. Combined with treeEventScopeId it resolves the
    // IndexPopulator instance whose repairNode replays this entry (see RepairFailedNodesTask).
    indexPopulatorKind: string;
    treeEventScopeId: TreeEventScopeId;

    operation: RepairOperation;
    // Needed by an 'index' replay to resolve the node's parentPath.
    parentNodeUid?: string;
    attempts: number;
    firstFailedAt: number;
    lastAttemptAt: number;
    // Backoff gate: a repair run only picks entries whose nextAttemptAt <= now.
    nextAttemptAt: number;
    // Last failure message, diagnostics only.
    lastError?: string;
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
        value: string | boolean;
    };
    treeVisitorStates: {
        key: string;
        value: BFSVisitorState;
        indexes: { by_updated_at: number };
    };
    repairEntries: {
        key: [string, string]; // [indexKind, nodeUid]
        value: RepairNodeEntry;
    };
}

type RawSearchDB = IDBPDatabase<SearchDBSchema>;

/**
 * `indexBlobs` holds blobs for every index kind in a single object store, keyed by
 * `[indexKind, blobName]`. To select rows for a single `indexKind`, we use a
 * compound-key prefix scan: arrays sort after strings in IndexedDB, so
 * `[indexKind, []]` sits just above every `[indexKind, <any string>]`.
 */
const indexBlobsKeyRangeForKind = (indexKind: IndexKind): IDBKeyRange =>
    IDBKeyRange.bound([indexKind, ''], [indexKind, []]);

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
                if (oldVersion < 2) {
                    const treeStore = database.createObjectStore('treeVisitorStates', { keyPath: 'id' });
                    treeStore.createIndex('by_updated_at', 'updatedAt');
                }
                if (oldVersion < 3) {
                    database.createObjectStore('repairEntries');
                }
            },
        });
        return new SearchDB(db);
    }

    // --- Index blobs (keyed by [indexKind, blobName]) ---

    async getDecryptedIndexBlob(
        key: [string, string],
        decrypt: (ciphertext: ArrayBuffer) => Promise<ArrayBuffer>
    ): Promise<ArrayBuffer | undefined> {
        const raw = await this.db.get('indexBlobs', key);
        if (raw === undefined) {
            return undefined;
        }
        return decrypt(raw);
    }

    async putEncryptedIndexBlob(
        key: [string, string],
        plaintext: ArrayBuffer,
        encrypt: (data: ArrayBuffer) => Promise<ArrayBuffer>
    ): Promise<[string, string]> {
        const encrypted = await encrypt(plaintext);
        return this.db.put('indexBlobs', encrypted, key);
    }

    deleteIndexBlob(key: [string, string]): Promise<void> {
        return this.db.delete('indexBlobs', key);
    }

    async getAllIndexBlobKeys(): Promise<[string, string][]> {
        return this.db.getAllKeys('indexBlobs');
    }

    /** Count the number of blobs persisted under `indexKind`. */
    async countIndexBlobs(indexKind: IndexKind): Promise<number> {
        return this.db.count('indexBlobs', indexBlobsKeyRangeForKind(indexKind));
    }

    /**
     * Sum the ciphertext byte size of every blob stored under `indexKind`.
     * Used by diagnostics to report per-index on-disk usage.
     */
    async getIndexBlobsByteSize(indexKind: IndexKind): Promise<number> {
        const blobs = await this.db.getAll('indexBlobs', indexBlobsKeyRangeForKind(indexKind));
        let total = 0;
        for (const blob of blobs) {
            total += blob.byteLength;
        }
        return total;
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

    /**
     * Last-known total document count for `indexKind`, persisted so it survives worker restarts.
     * Stored on the populator state row for that index kind - assumes one populator per index
     * kind today (true for every `IndexKind`); the first match is used if that ever changes.
     */
    async getIndexEntryCount(indexKind: IndexKind): Promise<number | undefined> {
        const states = await this.getAllPopulatorStates();
        return states.find((state) => state.indexKind === indexKind)?.documentCount;
    }

    async setIndexEntryCount(indexKind: IndexKind, count: number): Promise<void> {
        const states = await this.getAllPopulatorStates();
        const state = states.find((s) => s.indexKind === indexKind);
        if (!state) {
            return;
        }
        await this.putPopulatorState({ ...state, documentCount: count });
    }

    /**
     * Epoch-ms of the last completed eviction sweep for `indexKind`, so sweeps can be spaced at
     * least SEARCH_EVICTION_MIN_INTERVAL_MS apart. Same one-populator-per-kind assumption as
     * `getIndexEntryCount`.
     */
    async getLastEvictionAt(indexKind: IndexKind): Promise<number | undefined> {
        const states = await this.getAllPopulatorStates();
        return states.find((state) => state.indexKind === indexKind)?.lastEvictionAt;
    }

    async setLastEvictionAt(indexKind: IndexKind, timestamp: number): Promise<void> {
        const states = await this.getAllPopulatorStates();
        const state = states.find((s) => s.indexKind === indexKind);
        if (!state) {
            return;
        }
        await this.putPopulatorState({ ...state, lastEvictionAt: timestamp });
    }

    // --- User preferences & config ---

    async getSearchCryptoKey(decrypt: (ciphertext: string) => Promise<string>): Promise<string | undefined> {
        const value = await this.db.get('userSettings', 'searchCryptoKey');
        if (typeof value !== 'string') {
            return undefined;
        }
        return decrypt(value);
    }

    async putSearchCryptoKey(plaintext: string, encrypt: (data: string) => Promise<string>): Promise<string> {
        const encrypted = await encrypt(plaintext);
        return this.db.put('userSettings', encrypted, 'searchCryptoKey');
    }

    async isOptedIn(): Promise<boolean> {
        const value = await this.db.get('userSettings', 'optIn');
        return value === true;
    }

    setOptedIn(): Promise<string> {
        return this.db.put('userSettings', true, 'optIn');
    }

    // Set once when bootstrap completes the first time.
    // Used to keep the search field interactive during re-indexing (old blobs still queryable).
    async isSearchable(): Promise<boolean> {
        return (await this.db.get('userSettings', 'hasSearchableIndex')) === true;
    }

    markSearchableIndex(): Promise<string> {
        return this.db.put('userSettings', true, 'hasSearchableIndex');
    }

    // Whether the user has dismissed the one-time "index is partial" notice ("Got it") for the
    // current index. A user preference about a notice, not index state, so it lives here rather
    // than on the populator row - but it is scoped to "this index", not forever: clearIndex()
    // resets it (key rotation, blob-version wipe, or an explicit rebuild all start a fresh
    // indexing campaign whose outcome - capped or not - the user hasn't been told about yet), and
    // the full clear() ("Clear search data") resets it too.
    async isPartialIndexNoticeDismissed(): Promise<boolean> {
        return (await this.db.get('userSettings', 'partialIndexNoticeDismissed')) === true;
    }

    setPartialIndexNoticeDismissed(): Promise<string> {
        return this.db.put('userSettings', true, 'partialIndexNoticeDismissed');
    }

    async getSearchLibraryBlobVersion(): Promise<string | undefined> {
        const value = await this.db.get('userSettings', 'searchLibraryBlobVersion');
        return typeof value === 'string' ? value : undefined;
    }

    setSearchLibraryBlobVersion(version: string): Promise<string> {
        return this.db.put('userSettings', version, 'searchLibraryBlobVersion');
    }

    /**
     * Compares the persisted search-library blob-format version against `currentVersion`.
     * A mismatch (bumped deliberately when a library upgrade breaks blob compatibility)
     * wipes the index the same way key rotation does, then persists the new version so
     * the next bootstrap doesn't re-trigger the reset.
     */
    async ensureCompatibleBlobVersion(currentVersion: string): Promise<void> {
        const storedVersion = await this.getSearchLibraryBlobVersion();
        if (storedVersion === currentVersion) {
            return;
        }

        // Backward compatibility: indexes built before this version check existed have
        // no stored value. The check was introduced at version 1, so treat a missing
        // value as "1" rather than unversioned before deciding whether a wipe is needed.
        if ((storedVersion ?? '1') !== currentVersion) {
            await this.clearIndex();
        }
        await this.setSearchLibraryBlobVersion(currentVersion);
    }

    // --- BFS visitor states ---

    getBFSVisitorState(id: string): Promise<BFSVisitorState | undefined> {
        return this.db.get('treeVisitorStates', id);
    }

    putBFSVisitorState(state: BFSVisitorState): Promise<string> {
        return this.db.put('treeVisitorStates', state) as Promise<string>;
    }

    deleteBFSVisitorState(id: string): Promise<void> {
        return this.db.delete('treeVisitorStates', id);
    }

    async deleteStaleBFSVisitorStates(olderThanMs: number): Promise<void> {
        const cutoff = Date.now() - olderThanMs;
        const tx = this.db.transaction('treeVisitorStates', 'readwrite');
        const range = IDBKeyRange.upperBound(cutoff);
        const index = tx.store.index('by_updated_at');
        for await (const cursor of index.iterate(range)) {
            await cursor.delete();
        }
        await tx.done;
    }

    putRepairEntry(entry: RepairNodeEntry): Promise<[string, string]> {
        return this.db.put('repairEntries', entry, [entry.indexKind, entry.nodeUid]);
    }

    getAllRepairEntries(): Promise<RepairNodeEntry[]> {
        return this.db.getAll('repairEntries');
    }

    /** Count of quarantined (repairable) nodes across all populators. */
    countRepairEntries(): Promise<number> {
        return this.db.count('repairEntries');
    }

    deleteRepairEntry(key: [string, string]): Promise<void> {
        return this.db.delete('repairEntries', key);
    }

    /** Get UIDs currently quarantined. */
    async getQuarantinedNodeUids(indexKind: IndexKind, treeEventScopeId: TreeEventScopeId): Promise<Set<string>> {
        const entries = await this.getAllRepairEntries();
        const uids = new Set<string>();
        for (const entry of entries) {
            if (entry.indexKind === indexKind && entry.treeEventScopeId === treeEventScopeId) {
                uids.add(entry.nodeUid);
            }
        }
        return uids;
    }

    /**
     * Record or supersede a quarantined node.
     */
    recordRepairNode(params: {
        nodeUid: string;
        indexKind: IndexKind;
        indexPopulatorKind: string;
        treeEventScopeId: TreeEventScopeId;
        operation: RepairOperation;
        parentNodeUid?: string;
        lastError?: string;
    }): Promise<[string, string]> {
        const now = Date.now();
        return this.putRepairEntry({
            ...params,
            attempts: 0,
            firstFailedAt: now,
            lastAttemptAt: now,
            nextAttemptAt: now,
        });
    }

    /** Remove a repair entry once its node has been reprocessed successfully. */
    clearRepairNode(indexKind: IndexKind, nodeUid: string): Promise<void> {
        return this.deleteRepairEntry([indexKind, nodeUid]);
    }

    /** Every quarantined node due for a repair attempt (nextAttemptAt <= now), across all populators. */
    async getAllDueRepairNodes(now: number): Promise<RepairNodeEntry[]> {
        const entries = await this.getAllRepairEntries();
        return entries.filter((entry) => entry.nextAttemptAt <= now);
    }

    /** Persist a failed repair attempt: bump attempts and push out the next attempt with backoff. */
    recordFailedRepairAttempt(entry: RepairNodeEntry, lastError: string): Promise<[string, string]> {
        const attempts = entry.attempts + 1;
        const now = Date.now();
        return this.putRepairEntry({
            ...entry,
            attempts,
            lastAttemptAt: now,
            nextAttemptAt: now + computeBackoff(attempts),
            lastError,
        });
    }

    // Clear index blobs, subscriptions and populator states so the indexer rebuilds from scratch.
    // Used when the encryption key is regenerated (e.g. after key rotation).
    async clearIndex(): Promise<void> {
        await this.db.clear('indexBlobs');
        await this.db.clear('treeEventScopeSubscriptions');
        await this.db.clear('indexPopulatorStates');
        await this.db.delete('userSettings', 'hasSearchableIndex');
        // The dismissal is scoped to the index that earned it, not forever - a rebuild is a fresh
        // initial indexing campaign, and the new index may or may not end up partial, so the user
        // should be warned again if it does.
        await this.db.delete('userSettings', 'partialIndexNoticeDismissed');
        await this.db.clear('treeVisitorStates');
        await this.db.clear('repairEntries');
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
