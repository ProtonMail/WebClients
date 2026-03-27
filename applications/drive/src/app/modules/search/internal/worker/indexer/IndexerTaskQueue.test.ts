import type { MaybeNode, NodeEntity, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createMockNodeEntity } from '../../../../../utils/test/nodeEntity';
import { SearchDB } from '../../shared/SearchDB';
import type { TreeEventScopeId } from '../../shared/types';
import { FakeMainThreadBridge } from '../../testing/FakeMainThreadBridge';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexRegistry } from '../index/IndexRegistry';
import type { IndexerState } from './IndexerTaskQueue';
import { IndexerTaskQueue } from './IndexerTaskQueue';
import { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';

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

describe('IndexerTaskQueue', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;
    let treeSubRegistry: TreeSubscriptionRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        indexRegistry = new IndexRegistry();

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

    const createQueue = () => new IndexerTaskQueue(indexRegistry, bridge.asBridge(), db, treeSubRegistry);

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

    it('permanent error: sets permanentError on quota exceeded', async () => {
        bridge.setIterateFolderChildrenError(new DOMException('', 'QuotaExceededError'));

        const queue = createQueue();
        const state = new IndexerStateStream(queue);
        queue.start().catch(() => {});

        const errored = await state.waitForPermanentError();
        expect(errored.permanentError).toBe('quota_exceeded');
    });
});
