import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { MaybeNode, NodeEntity, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { RateLimitedError as SdkRateLimitedError } from '@proton/drive';

import { createMockNodeEntity } from '../../../../../utils/test/nodeEntity';
import { SearchDB } from '../../shared/SearchDB';
import {
    DEFAULT_RETRY_AFTER_IN_MS,
    InvalidIndexerState,
    SearchLibraryError,
    TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS,
    TRANSIENT_REPORT_THROTTLE_MS,
    sendErrorReportForSearch,
} from '../../shared/errors';
import { resetTransientReportBurstsForTests } from '../../shared/searchMetrics';
import type { TreeEventScopeId, UserId } from '../../shared/types';
import { FakeMainThreadBridge } from '../../testing/FakeMainThreadBridge';
import { findDocuments } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../index/IndexRegistry';
import { createBridgedSearchMetrics } from '../workerSearchMetrics';
import type { IndexerState } from './IndexerTaskQueue';
import { IndexerTaskQueue } from './IndexerTaskQueue';
import { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';
import { NodeTreeIndexPopulator } from './indexPopulators/NodeTreeIndexPopulator';
import type { BaseTask } from './tasks/BaseTask';
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

/**
 * Advance jest fake timers in 1s chunks so:
 * - Multi-await microtask chains (bootstrap → run → IndexedDB ops → throw → catch) drain.
 * - Nested timers (a retry timer firing schedules the next retry timer) actually run.
 * `advanceTimersByTimeAsync(N)` in one big call only fires timers that exist at call time.
 */
async function fakeAdvance(totalMs: number): Promise<void> {
    if (totalMs === 0) {
        for (let i = 0; i < 30; i++) {
            await jest.advanceTimersByTimeAsync(0);
        }
        return;
    }
    let elapsed = 0;
    while (elapsed < totalMs) {
        const step = Math.min(1000, totalMs - elapsed);
        await jest.advanceTimersByTimeAsync(step);
        elapsed += step;
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
        // searchMetrics keeps a module-level transient-error throttle map keyed by task UID.
        // Tests reuse the same populator UIDs so leftover counts would skew burst assertions.
        resetTransientReportBurstsForTests();

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

    // Use the real bridged proxy so `markIndexerError` propagates to main-thread
    // `searchMetrics`, which in turn drives the Sentry-report classification that
    // several tests below assert against.
    const createQueue = () =>
        new IndexerTaskQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );

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
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'myfiles',
            treeEventScopeId: SCOPE_ID,
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

        const queue = new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
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
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'myfiles',
            treeEventScopeId: SCOPE_ID,
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

        const queue = new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
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

    it('permanent error halts the queue: postBootstrap tasks do not run', async () => {
        let postBootstrapRan = false;

        class PostBootstrapTask {
            getUid() {
                return 'post-bootstrap';
            }
            async execute() {
                postBootstrapRan = true;
            }
        }

        class DummyTestIndexPopulator extends NodeTreeIndexPopulator {
            constructor(scopeId: TreeEventScopeId) {
                super(scopeId, IndexKind.MAIN, 'myfiles', 1);
            }
            protected async getRootNodeUid(): Promise<string> {
                return 'root-uid';
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                bridge.setIterateFolderChildrenError(new DOMException('', 'QuotaExceededError'));
                const populator = new DummyTestIndexPopulator(SCOPE_ID);
                return {
                    bootstrapTasks: [new IndexPopulatorTask(populator, true)],
                    postBootstrapTasks: [new PostBootstrapTask() as unknown as BaseTask],
                };
            }
        }

        const queue = new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        await state.waitForPermanentError();
        // Yield once more so any post-stop microtasks would have a chance to fire.
        await new Promise((r) => setTimeout(r, 50));

        expect(postBootstrapRan).toBe(false);
    });

    it('transient error on IndexPopulatorTask retries with backoff', async () => {
        let callCount = 0;

        class FlakyPopulator extends NodeTreeIndexPopulator {
            constructor(scopeId: TreeEventScopeId) {
                super(scopeId, IndexKind.MAIN, 'myfiles', 1);
            }

            protected async getRootNodeUid(): Promise<string> {
                callCount++;
                if (callCount === 1) {
                    throw new Error('transient flake');
                }
                return 'root-uid';
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                const populator = new FlakyPopulator(SCOPE_ID);
                return {
                    bootstrapTasks: [new IndexPopulatorTask(populator, true)],
                    postBootstrapTasks: [],
                };
            }
        }

        const queue = new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
        queue.start().catch(() => {});

        // Wait until the populator has retried AND completed (state.done = true). callCount=2 only
        // signals that the retry has *started*; the full flow (iterate -> persist) needs more time.
        await waitForCondition(async () => {
            const s = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
            return callCount >= 2 && s?.done === true;
        });

        queue.stop();

        expect(callCount).toBe(2);
        const populatorState = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
        expect(populatorState?.done).toBe(true);
    });

    it('abort error is swallowed without retry or permanent state', async () => {
        let callCount = 0;

        class AbortingPopulator extends NodeTreeIndexPopulator {
            constructor(scopeId: TreeEventScopeId) {
                super(scopeId, IndexKind.MAIN, 'myfiles', 1);
            }

            protected async getRootNodeUid(): Promise<string> {
                callCount++;
                throw new DOMException('aborted', 'AbortError');
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                const populator = new AbortingPopulator(SCOPE_ID);
                return {
                    bootstrapTasks: [new IndexPopulatorTask(populator, true)],
                    postBootstrapTasks: [],
                };
            }
        }

        const queue = new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        // Abort errors should not retry: the queue empties and goes searchable.
        const searchable = await state.waitForSearchable();
        queue.stop();

        // Yield to confirm no late retry sneaks in.
        await new Promise((r) => setTimeout(r, 50));

        expect(callCount).toBe(1);
        expect(searchable.permanentError).toBeNull();
        // Populator did not complete, so it was never marked done.
        const populatorState = await db.getPopulatorState(`myfiles:${SCOPE_ID}`);
        expect(populatorState?.done ?? false).toBe(false);
    });

    it('stop() clears pending retry timeouts', async () => {
        class AlwaysFailingPopulator extends NodeTreeIndexPopulator {
            constructor(scopeId: TreeEventScopeId) {
                super(scopeId, IndexKind.MAIN, 'myfiles', 1);
            }

            protected async getRootNodeUid(): Promise<string> {
                throw new Error('always fails');
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                const populator = new AlwaysFailingPopulator(SCOPE_ID);
                return {
                    bootstrapTasks: [new IndexPopulatorTask(populator, true)],
                    postBootstrapTasks: [],
                };
            }
        }

        const queue = new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
        queue.start().catch(() => {});

        const pending = (queue as unknown as { pendingTimeouts: Set<unknown> }).pendingTimeouts;
        await waitForCondition(() => pending.size > 0);
        expect(pending.size).toBeGreaterThan(0);

        queue.stop();
        expect(pending.size).toBe(0);
    });

    /**
     * Builds a queue whose only bootstrap task is an IndexPopulatorTask wrapping a populator
     * that throws `error` from its first iteration step. Used to drive the queue into a
     * specific error path without rebuilding the whole bootstrap flow each time.
     */
    function makeQueueWithFailingPopulator(error: unknown): IndexerTaskQueue {
        class FailingPopulator extends NodeTreeIndexPopulator {
            constructor() {
                super(SCOPE_ID, IndexKind.MAIN, 'myfiles', 1);
            }
            protected async getRootNodeUid(): Promise<string> {
                throw error;
            }
        }
        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                return {
                    bootstrapTasks: [new IndexPopulatorTask(new FailingPopulator(), true)],
                    postBootstrapTasks: [],
                };
            }
        }
        return new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
    }

    it('permanent error: corrupted_db (DOMException VersionError)', async () => {
        const queue = makeQueueWithFailingPopulator(new DOMException('', 'VersionError'));
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        const errored = await state.waitForPermanentError();
        expect(errored.permanentError).toBe('corrupted_db');
        queue.stop();
    });

    it('permanent error: invalid_indexer_state', async () => {
        const queue = makeQueueWithFailingPopulator(new InvalidIndexerState('bad state'));
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        const errored = await state.waitForPermanentError();
        expect(errored.permanentError).toBe('invalid_indexer_state');
        queue.stop();
    });

    it('permanent error: search_library_error', async () => {
        const queue = makeQueueWithFailingPopulator(new SearchLibraryError('wasm crash', null));
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        const errored = await state.waitForPermanentError();
        expect(errored.permanentError).toBe('search_library_error');
        queue.stop();
    });

    it('rate-limited error retries with DEFAULT_RETRY_AFTER_IN_MS, not computeBackoff', async () => {
        let callCount = 0;

        class RateLimitedPopulator extends NodeTreeIndexPopulator {
            constructor() {
                super(SCOPE_ID, IndexKind.MAIN, 'myfiles', 1);
            }
            protected async getRootNodeUid(): Promise<string> {
                callCount++;
                throw new SdkRateLimitedError('429');
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                return {
                    bootstrapTasks: [new IndexPopulatorTask(new RateLimitedPopulator(), true)],
                    postBootstrapTasks: [],
                };
            }
        }

        (sendErrorReportForSearch as jest.Mock).mockClear();
        jest.useFakeTimers();
        let queue: IndexerTaskQueue | null = null;
        try {
            queue = new TestableQueue(
                'test-user' as UserId,
                indexRegistry,
                bridge.asBridge(),
                db,
                treeSubRegistry,
                createBridgedSearchMetrics(bridge.asBridge())
            );
            queue.start().catch(() => {});

            // Drain microtasks so the first failure registers and a retry is scheduled.
            await fakeAdvance(0);
            expect(callCount).toBe(1);

            // computeBackoff(1) is at most 1200ms. If the queue were using it, retry would have
            // fired by 5s. DEFAULT_RETRY_AFTER_IN_MS is 30s, so call count must still be 1.
            await fakeAdvance(5_000);
            expect(callCount).toBe(1);

            // Advance past the 30s mark and drain microtasks so the loop can wake up,
            // pick up the re-enqueued task, run it, and increment callCount.
            await fakeAdvance(DEFAULT_RETRY_AFTER_IN_MS);
            await fakeAdvance(0);
            expect(callCount).toBe(2);
        } finally {
            queue?.stop();
            jest.useRealTimers();
        }
    });

    it('Sentry reports a burst of MAX_REPORTED_ATTEMPTS per task UID, then a fresh burst after the throttle window', async () => {
        const errorReportMock = sendErrorReportForSearch as jest.Mock;
        errorReportMock.mockClear();

        class AlwaysFailingPopulator extends NodeTreeIndexPopulator {
            constructor() {
                super(SCOPE_ID, IndexKind.MAIN, 'myfiles', 1);
            }
            protected async getRootNodeUid(): Promise<string> {
                throw new Error('always fails');
            }
        }

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                return {
                    bootstrapTasks: [new IndexPopulatorTask(new AlwaysFailingPopulator(), true)],
                    postBootstrapTasks: [],
                };
            }
        }

        // Neutralize jitter so the backoff schedule advances deterministically.
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        jest.useFakeTimers();
        let queue: IndexerTaskQueue | null = null;
        try {
            queue = new TestableQueue(
                'test-user' as UserId,
                indexRegistry,
                bridge.asBridge(),
                db,
                treeSubRegistry,
                createBridgedSearchMetrics(bridge.asBridge())
            );
            queue.start().catch(() => {});

            // Backoff schedule (no jitter): 1s, 2s, 5s, 10s, 30s, 60s, 60s, ...
            // Run plenty of retries while staying inside the throttle window so the
            // burst caps at MAX_REPORTED_ATTEMPTS and further retries stay silent.
            await fakeAdvance(TRANSIENT_REPORT_THROTTLE_MS - 1);

            const reportsInWindow = errorReportMock.mock.calls.filter(([msg]) =>
                String(msg).includes('transient error')
            );
            expect(reportsInWindow).toHaveLength(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);
            // Stable message (no attempt number) so Sentry groups them.
            expect(reportsInWindow.every(([msg]) => msg === 'Search transient error (unknown)')).toBe(true);

            // Cross the throttle window - a new burst should be allowed.
            await fakeAdvance(TRANSIENT_REPORT_THROTTLE_MS);

            const reportsAfterWindow = errorReportMock.mock.calls.filter(([msg]) =>
                String(msg).includes('transient error')
            );
            expect(reportsAfterWindow.length).toBeGreaterThan(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);
            expect(reportsAfterWindow.length).toBeLessThanOrEqual(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS * 2);
            expect(reportsAfterWindow.every(([msg]) => msg === 'Search transient error (unknown)')).toBe(true);
        } finally {
            queue?.stop();
            jest.useRealTimers();
            randomSpy.mockRestore();
        }
    });

    it('non-IndexPopulatorTask transient error is dropped, not retried', async () => {
        let failingRunCount = 0;
        let followUpRan = false;

        const failingTask = {
            getUid: () => 'failing-task',
            getKind: () => 'persist-data-task',
            execute: async () => {
                failingRunCount++;
                throw new Error('transient');
            },
        } as unknown as BaseTask;

        const followUpTask = {
            getUid: () => 'follow-up',
            getKind: () => 'persist-data-task',
            execute: async () => {
                followUpRan = true;
            },
        } as unknown as BaseTask;

        class TestableQueue extends IndexerTaskQueue {
            protected override async createTasks() {
                return {
                    bootstrapTasks: [failingTask, followUpTask],
                    postBootstrapTasks: [],
                };
            }
        }

        const queue = new TestableQueue(
            'test-user' as UserId,
            indexRegistry,
            bridge.asBridge(),
            db,
            treeSubRegistry,
            createBridgedSearchMetrics(bridge.asBridge())
        );
        queue.start().catch(() => {});

        await waitForCondition(() => followUpRan);

        // Failing task ran once and was NOT re-enqueued (no retry timer scheduled).
        expect(failingRunCount).toBe(1);
        // Queue continued to subsequent tasks despite the transient failure.
        expect(followUpRan).toBe(true);

        const pending = (queue as unknown as { pendingTimeouts: Set<unknown> }).pendingTimeouts;
        expect(pending.size).toBe(0);

        queue.stop();
    });
});
