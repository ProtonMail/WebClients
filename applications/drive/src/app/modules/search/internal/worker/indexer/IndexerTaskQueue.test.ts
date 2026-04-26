import type { MaybeNode, NodeEntity, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import { createMockNodeEntity } from '../../../../../utils/test/nodeEntity';
import { SearchDB } from '../../shared/SearchDB';
import type { TreeEventScopeId, UserId } from '../../shared/types';
import { FakeMainThreadBridge } from '../../testing/FakeMainThreadBridge';
import { findDocuments } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../index/IndexRegistry';
import type { IndexerState } from './IndexerTaskQueue';
import { IndexerTaskQueue } from './IndexerTaskQueue';
import { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';
import { NodeTreeIndexPopulator } from './indexPopulators/NodeTreeIndexPopulator';
import { IndexPopulatorTask } from './tasks/CoreTasks/IndexPopulatorTask';

setupRealSearchLibraryWasm();

jest.mock('../../shared/errors', () => {
    const actual = jest.requireActual('../../shared/errors');
    return {
        ...actual,
        sendErrorReportForSearch: jest.fn(),
    };
});

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Partial<NodeEntity> = {}): MaybeNode =>
    ({ ok: true, value: createMockNodeEntity(overrides) }) as unknown as MaybeNode;

/**
 * Wraps IndexerTaskQueue.onStateChange into an awaitable stream with named wait helpers.
 */
class IndexerStateStream {
    readonly history: IndexerState[] = [];
    private pending: ((state: IndexerState) => void)[] = [];
    private buffer: IndexerState[] = [];

    constructor(queue: IndexerTaskQueue) {
        queue.onStateChange((state) => {
            const snapshot = { ...state };
            this.history.push(snapshot);
            const waiter = this.pending.shift();
            if (waiter) {
                waiter(snapshot);
            } else {
                this.buffer.push(snapshot);
            }
        });
    }

    private next(): Promise<IndexerState> {
        const buffered = this.buffer.shift();
        if (buffered) {
            return Promise.resolve(buffered);
        }
        return new Promise<IndexerState>((resolve) => {
            this.pending.push(resolve);
        });
    }

    async waitUntil(predicate: (s: IndexerState) => boolean): Promise<IndexerState> {
        const idx = this.buffer.findIndex(predicate);
        if (idx !== -1) {
            const match = this.buffer[idx];
            this.buffer.splice(0, idx + 1);
            return match;
        }
        while (true) {
            const state = await this.next();
            if (predicate(state)) {
                return state;
            }
        }
    }

    waitForIndexingStart() {
        return this.waitUntil((s) => s.isIndexing);
    }

    waitForSearchable() {
        return this.waitUntil((s) => s.isSearchable);
    }

    waitForPermanentError() {
        return this.waitUntil((s) => s.permanentError !== null);
    }
}

/** Yield to the event loop until `predicate` returns true (max ~50 ticks). */
async function waitForCondition(predicate: () => boolean | Promise<boolean>, maxTicks = 50): Promise<void> {
    for (let i = 0; i < maxTicks; i++) {
        if (await predicate()) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('waitForCondition: timed out');
}

describe('IndexerTaskQueue', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;
    let treeSubRegistry: TreeSubscriptionRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);

        const rootNode = makeMaybeNode({
            uid: 'root-uid',
            name: 'My Files',
            type: 'folder' as any,
            treeEventScopeId: SCOPE_ID,
        });
        bridge.setMyFilesRootNode(rootNode);
        bridge.setChildren('root-uid', [
            makeMaybeNode({ uid: 'file-1', name: 'report.pdf', type: 'file' as NodeType }),
            makeMaybeNode({ uid: 'file-2', name: 'notes.txt', type: 'file' as NodeType }),
        ]);

        treeSubRegistry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
    });

    const createQueue = () =>
        new IndexerTaskQueue('test-user' as UserId, indexRegistry, bridge.asBridge(), db, treeSubRegistry);

    it('bootstrap: transitions through expected states', async () => {
        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        const searchable = await state.waitForSearchable();
        queue.stop();

        // Initial indexing must have occurred at some point
        expect(state.history.some((s) => s.isInitialIndexing && s.isIndexing)).toBe(true);

        // Final state: searchable, no longer indexing
        expect(searchable.isSearchable).toBe(true);
        expect(searchable.isInitialIndexing).toBe(false);
        expect(searchable.isIndexing).toBe(false);
        expect(searchable.permanentError).toBeNull();
    });

    it('stop() aborts processing and start resolves', async () => {
        const queue = createQueue();
        const startPromise = queue.start();
        queue.stop();

        await expect(startPromise).resolves.not.toThrow();
    });

    it('PersistDataTask runs after bootstrap (cursors persisted to DB)', async () => {
        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        await state.waitForSearchable();
        queue.stop();

        const subs = await db.getAllSubscriptions();
        expect(subs).toHaveLength(1);
        expect(subs[0].treeEventScopeId).toBe(SCOPE_ID);
        expect(subs[0].lastEventId).toBe('evt-1');
    });

    it('populator state is persisted as done after bootstrap', async () => {
        expect(await db.getAllPopulatorStates()).toHaveLength(0);

        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        expect(await db.getAllSubscriptions()).toHaveLength(0);

        await state.waitForIndexingStart();

        const subs = await db.getAllSubscriptions();
        expect(subs).toHaveLength(1);
        expect(subs[0].treeEventScopeId).toBe(SCOPE_ID);
        expect(subs[0].lastEventId).toBe('evt-1');

        const populators = await db.getAllPopulatorStates();
        expect(populators).toHaveLength(1);
        expect(populators[0].done).toBe(false);
        expect(populators[0].generation).toBe(1);

        await state.waitForSearchable();
        queue.stop();

        const indexPopulatorStates = await db.getAllPopulatorStates();
        expect(indexPopulatorStates).toHaveLength(1);
        expect(indexPopulatorStates[0].done).toBe(true);
        expect(indexPopulatorStates[0].generation).toBe(1);
    });

    it('onStateChange notifies multiple listeners', async () => {
        const queue = createQueue();
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        queue.onStateChange(listener1);
        queue.onStateChange(listener2);

        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});
        await state.waitForSearchable();
        queue.stop();

        expect(listener1).toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
    });

    it('starts incremental update scheduling after bootstrap so events trigger incremental updates', async () => {
        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        await state.waitForSearchable();

        jest.useFakeTimers();

        // Registry should now be wired — emitting an event should enqueue an IncrementalUpdateTask
        // after the 5s cooldown. Use fast_forward which just advances the cursor.
        bridge.emitEvent(SCOPE_ID, { type: 'fast_forward', eventId: 'evt-2' } as any);

        // Advance past the cooldown so the debounced enqueueOnce fires.
        await jest.advanceTimersByTimeAsync(5_000);

        jest.useRealTimers();

        // Wait for the processLoop to execute the enqueued IncrementalUpdateTask.
        const reg = treeSubRegistry.getAllRegistrations()[0];
        await waitForCondition(() => reg.lastEventId === 'evt-2');

        queue.stop();
    });

    it('deletes legacy encrypted-search DB after bootstrap', async () => {
        // Create a legacy DB for the test user.
        const legacyRequest = indexedDB.open('ES:test-user:DB', 1);
        const legacyDb = await new Promise<IDBDatabase>((resolve) => {
            legacyRequest.onsuccess = () => resolve(legacyRequest.result);
        });
        legacyDb.close();

        const databases = await indexedDB.databases();
        expect(databases.some(({ name }) => name === 'ES:test-user:DB')).toBe(true);

        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        await state.waitForSearchable();

        // Deletion is fire-and-forget; yield to let it complete.
        await waitForCondition(async () => {
            const dbs = await indexedDB.databases();
            return !dbs.some(({ name }) => name === 'ES:test-user:DB');
        });

        queue.stop();
    });

    it('re-indexes when populator version changed since last run', async () => {
        // Seed DB with a done state at version 1.
        await db.putPopulatorState({
            uid: `myfiles:${SCOPE_ID}`,
            done: true,
            generation: 1,
            version: 1,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        });

        // Create a queue whose populator reports version 2.
        class VersionedPopulator extends NodeTreeIndexPopulator {
            constructor(scopeId: TreeEventScopeId) {
                super(scopeId, IndexKind.MAIN, 'myfiles', 2 /* version */);
            }

            protected async getRootNodeUid(): Promise<string> {
                return 'root-uid';
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                const populator = new VersionedPopulator(SCOPE_ID);
                return {
                    bootstrapTasks: [new IndexPopulatorTask(populator, true)],
                    postBootstrapTasks: [],
                };
            }
        }

        const queue = new TestableQueue('test-user' as UserId, indexRegistry, bridge.asBridge(), db, treeSubRegistry);
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        // If version check works, the queue re-indexes (isIndexing) then becomes searchable.
        await state.waitForSearchable();
        queue.stop();

        // Verify that it went through reindexing.
        expect(state.history.some((s) => s.isIndexing)).toBe(true);

        const persisted = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
        expect(persisted?.done).toBe(true);
        expect(persisted?.version).toBe(2);
    });

    it('tree_refresh bumps generation and re-indexes entries with new generation', async () => {
        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        await state.waitForSearchable();

        // Verify initial indexing produced entries at generation 1.
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const gen1Results = await findDocuments(instance.indexReader, { indexPopulatorGeneration: BigInt(1) });
        expect(gen1Results).toHaveLength(2);

        const populatorBefore = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
        expect(populatorBefore?.done).toBe(true);
        expect(populatorBefore?.generation).toBe(1);

        // Emit a tree_refresh event to trigger generation bump.
        jest.useFakeTimers();
        bridge.emitEvent(SCOPE_ID, { type: 'tree_refresh', eventId: 'evt-2' } as any);
        await jest.advanceTimersByTimeAsync(5_000);
        jest.useRealTimers();

        // Wait for re-indexing to complete (state goes back to not-indexing after the re-index).
        await waitForCondition(async () => {
            const s = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
            return s?.done === true && s?.generation === 2;
        });

        queue.stop();

        // Verify generation was bumped and entries were re-indexed at generation 2.
        const populatorAfter = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
        expect(populatorAfter?.done).toBe(true);
        expect(populatorAfter?.generation).toBe(2);

        const gen2Results = await findDocuments(instance.indexReader, { indexPopulatorGeneration: BigInt(2) });
        expect(gen2Results).toHaveLength(2);
    });

    it('version change bumps generation from persisted state', async () => {
        // Seed DB with a done state at version 1, generation 3 (simulating prior bumps).
        await db.putPopulatorState({
            uid: `myfiles:${SCOPE_ID}`,
            done: true,
            generation: 3,
            version: 1,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        });

        class VersionedPopulator extends NodeTreeIndexPopulator {
            constructor(scopeId: TreeEventScopeId) {
                super(scopeId, IndexKind.MAIN, 'myfiles', 2 /* version */);
            }

            protected async getRootNodeUid(): Promise<string> {
                return 'root-uid';
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                const populator = new VersionedPopulator(SCOPE_ID);
                return {
                    bootstrapTasks: [new IndexPopulatorTask(populator, true)],
                    postBootstrapTasks: [],
                };
            }
        }

        const queue = new TestableQueue('test-user' as UserId, indexRegistry, bridge.asBridge(), db, treeSubRegistry);
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        await state.waitForSearchable();
        queue.stop();

        // Generation should have incremented from 3 → 4 due to version mismatch.
        const persisted = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
        expect(persisted?.done).toBe(true);
        expect(persisted?.generation).toBe(4);
        expect(persisted?.version).toBe(2);

        // All entries should carry the bumped generation.
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const gen4Results = await findDocuments(instance.indexReader, { indexPopulatorGeneration: BigInt(4) });
        expect(gen4Results).toHaveLength(2);

        const gen3Results = await findDocuments(instance.indexReader, { indexPopulatorGeneration: BigInt(3) });
        expect(gen3Results).toHaveLength(0);
    });

    it('tree_refresh re-indexes entries replacing old generation with new', async () => {
        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        await state.waitForSearchable();

        const instance = await indexRegistry.get(IndexKind.MAIN, db);

        // Initial entries at generation 1.
        const gen1Before = await findDocuments(instance.indexReader, { indexPopulatorGeneration: BigInt(1) });
        expect(gen1Before).toHaveLength(2);

        // Trigger tree_refresh to bump generation.
        jest.useFakeTimers();
        bridge.emitEvent(SCOPE_ID, { type: 'tree_refresh', eventId: 'evt-2' } as any);
        await jest.advanceTimersByTimeAsync(5_000);
        jest.useRealTimers();

        await waitForCondition(async () => {
            const s = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
            return s?.done === true && s?.generation === 2;
        });

        queue.stop();

        // Entries are re-indexed at generation 2 (same document IDs, overwritten in-place).
        const gen2Results = await findDocuments(instance.indexReader, { indexPopulatorGeneration: BigInt(2) });
        expect(gen2Results).toHaveLength(2);

        // Generation 1 entries no longer exist (replaced by the re-index).
        const gen1After = await findDocuments(instance.indexReader, { indexPopulatorGeneration: BigInt(1) });
        expect(gen1After).toHaveLength(0);
    });

    it('permanent error: sets permanentError on quota exceeded', async () => {
        bridge.setIterateFolderChildrenError(new DOMException('', 'QuotaExceededError'));

        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        const errored = await state.waitForPermanentError();
        expect(errored.permanentError).toBe('quota_exceeded');
    });
});
