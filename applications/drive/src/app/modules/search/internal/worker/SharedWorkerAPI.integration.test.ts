import type { MaybeNode, NodeEntity } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createMockNodeEntity } from '../../../../utils/test/nodeEntity';
import { SearchDB } from '../shared/SearchDB';
import type {
    ClientId,
    SearchModuleState,
    SearchResultItem,
    TreeEventScopeId,
    UserId,
    WorkerSearchResultEvent,
} from '../shared/types';
import { FakeBroadcastChannel } from '../testing/FakeBroadcastChannel';
import { FakeMainThreadBridge } from '../testing/FakeMainThreadBridge';
import { setupRealSearchLibraryWasm } from '../testing/setupRealSearchLibraryWasm';
import { SharedWorkerAPI } from './SharedWorkerAPI';

setupRealSearchLibraryWasm();

jest.mock('../shared/errors', () => {
    const actual = jest.requireActual('../shared/errors');
    return { ...actual, sendErrorReportForSearch: jest.fn() };
});

global.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;

// --- Constants ---

const USER_ID = 'test-user' as UserId;
const CLIENT_A = 'client-a' as ClientId;
const CLIENT_B = 'client-b' as ClientId;
const SCOPE_ID = 'scope-1' as TreeEventScopeId;
const STATE_CHANNEL = `search-state-${USER_ID}`;

// --- Node helpers ---

const makeMaybeNode = (overrides: Partial<NodeEntity> = {}): MaybeNode =>
    ({ ok: true, value: createMockNodeEntity(overrides) }) as unknown as MaybeNode;

const folder = (uid: string, name: string) => makeMaybeNode({ uid, name, type: 'folder' as any });
const trashedFolder = (uid: string, name: string) =>
    makeMaybeNode({ uid, name, type: 'folder' as any, trashTime: new Date() });
const file = (uid: string, name: string) => makeMaybeNode({ uid, name, type: 'file' as any });
const trashedFile = (uid: string, name: string) =>
    makeMaybeNode({ uid, name, type: 'file' as any, trashTime: new Date() });

// --- State stream ---

type StateMessage = Partial<SearchModuleState>;

/**
 * Listens on the search state BroadcastChannel and turns updates into an awaitable stream.
 * Call `next()` to wait for the next update, or `until(predicate)` to skip ahead.
 */
class SearchModuleStateStream {
    readonly history: StateMessage[] = [];
    private channel: FakeBroadcastChannel;
    private pending: ((msg: StateMessage) => void)[] = [];
    private buffer: StateMessage[] = [];
    private lastCheckpoint = 0;

    constructor() {
        this.channel = new FakeBroadcastChannel(STATE_CHANNEL);
        this.channel.onmessage = (ev: MessageEvent<StateMessage>) => {
            this.history.push(ev.data);
            const waiter = this.pending.shift();
            if (waiter) {
                waiter(ev.data);
            } else {
                this.buffer.push(ev.data);
            }
        };
    }

    /** Resets expect* and waitFor* methods to only consider states received after this call. */
    checkpoint() {
        this.lastCheckpoint = this.history.length;
    }

    /** History since the last checkpoint. */
    private sinceLastCheckpoint(): StateMessage[] {
        return this.history.slice(this.lastCheckpoint);
    }

    private lastValueOf(key: keyof StateMessage): boolean | undefined {
        const recent = this.sinceLastCheckpoint();
        for (let i = recent.length - 1; i >= 0; i--) {
            if (recent[i][key] !== undefined) {
                return recent[i][key] as boolean;
            }
        }
        return undefined;
    }

    /** Wait for the next state update. */
    next(): Promise<StateMessage> {
        const buffered = this.buffer.shift();
        if (buffered) {
            return Promise.resolve(buffered);
        }
        return new Promise<StateMessage>((resolve) => {
            this.pending.push(resolve);
        });
    }

    /** Wait for the next state update and assert it matches. Throws if it doesn't. */
    async expectNext(expected: StateMessage): Promise<void> {
        const actual = await this.next();
        expect(actual).toEqual(expect.objectContaining(expected));
    }

    /** Advances fake timers in small increments until a matching state arrives. */
    async waitUntil(predicate: (msg: StateMessage) => boolean, maxIterations = 1000): Promise<StateMessage> {
        const idx = this.buffer.findIndex(predicate);
        if (idx !== -1) {
            const match = this.buffer[idx];
            this.buffer.splice(0, idx + 1);
            return match;
        }

        for (let i = 0; i < maxIterations; i++) {
            await jest.advanceTimersByTimeAsync(200);
            const found = this.buffer.findIndex(predicate);
            if (found !== -1) {
                const match = this.buffer[found];
                this.buffer.splice(0, found + 1);
                return match;
            }
        }
        throw new Error('waitUntil: timed out');
    }

    async waitForIndexingStart() {
        expect(this.lastValueOf('isIndexing')).not.toBe(true);
        return this.waitUntil((msg) => msg.isIndexing === true);
    }

    async waitForIndexingEnd() {
        expect(this.lastValueOf('isIndexing')).not.toBe(false);
        return this.waitUntil((msg) => msg.isIndexing === false);
    }

    async waitForInitialIndexingStart() {
        expect(this.lastValueOf('isInitialIndexing')).not.toBe(true);
        return this.waitUntil((msg) => msg.isInitialIndexing === true);
    }

    async waitForSearchable() {
        expect(this.lastValueOf('isSearchable')).not.toBe(true);
        return this.waitUntil((msg) => msg.isSearchable === true);
    }

    async waitForPermanentError() {
        return this.waitUntil((msg) => msg.permanentError !== undefined && msg.permanentError !== null);
    }

    /** Assert no state updates received since the last checkpoint. */
    expectNoUpdatesSinceCheckpoint() {
        expect(this.sinceLastCheckpoint()).toHaveLength(0);
        expect(this.buffer).toHaveLength(0);
    }

    /** Assert isSearchable was never true since the last checkpoint. */
    expectNeverSearchableSinceCheckpoint() {
        expect(this.sinceLastCheckpoint().every((s) => s.isSearchable !== true)).toBe(true);
    }

    /** Assert isInitialIndexing was never true since the last checkpoint. */
    expectNeverInitialIndexingSinceCheckpoint() {
        expect(this.sinceLastCheckpoint().every((s) => s.isInitialIndexing !== true)).toBe(true);
    }

    close() {
        this.channel.close();
    }
}

function expectState(actual: StateMessage, expected: StateMessage) {
    expect(actual).toEqual(expect.objectContaining(expected));
}

// --- Search helper ---

async function search(
    api: SharedWorkerAPI,
    query: string,
    filters?: Record<string, string | bigint | boolean>
): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];
    await api.search({ filename: query, filters }, (event: WorkerSearchResultEvent) => {
        if (event.type === 'item') {
            results.push(event);
        }
    });
    return results;
}

async function getAllIndexedItemsForGeneration(api: SharedWorkerAPI, generation: number): Promise<SearchResultItem[]> {
    return search(api, '', { indexPopulatorGeneration: BigInt(generation) });
}

// Verify that non-trashed reports are found and trashed ones are not.
async function verifyThatUserCanSearchIndexProperly(api: SharedWorkerAPI) {
    const ids = (await search(api, 'report')).map((r) => r.nodeUid).sort();
    expect(ids).toEqual(['old-report', 'report-q1', 'report-q2']);
    expect(ids).not.toContain('report-deleted');

    // Trashed files should not appear for any query
    const allDeleted = (await search(api, 'deleted')).map((r) => r.nodeUid);
    expect(allDeleted).toHaveLength(0);
}

// --- Tree setup ---

function buildComplexTree(bridge: FakeMainThreadBridge) {
    //   root/
    //   ├── folder-projects/
    //   │   ├── report-q1.pdf
    //   │   ├── report-q2.pdf
    //   │   └── folder-archive/
    //   │       └── old-report.pdf
    //   ├── folder-photos/
    //   │   └── vacation.jpg
    //   ├── notes.txt
    //   ├── folder-empty/
    //   └── folder-trash/ (trashed)
    //       ├── report-deleted.pdf (trashed)
    //       ├── deleted-doc.txt (trashed)
    //       └── folder-deep-trash/
    //           └── deep-deleted.pdf

    bridge.setMyFilesRootNode(
        makeMaybeNode({ uid: 'root-uid', name: 'My Files', type: 'folder' as any, treeEventScopeId: SCOPE_ID })
    );
    bridge.setChildren('root-uid', [
        folder('folder-projects', 'Projects'),
        folder('folder-photos', 'Photos'),
        file('notes', 'notes.txt'),
        folder('folder-empty', 'Empty'),
        trashedFolder('folder-trash', 'Trash'),
    ]);
    bridge.setChildren('folder-projects', [
        file('report-q1', 'report-q1.pdf'),
        file('report-q2', 'report-q2.pdf'),
        folder('folder-archive', 'Archive'),
    ]);
    bridge.setChildren('folder-archive', [file('old-report', 'old-report.pdf')]);
    bridge.setChildren('folder-photos', [file('vacation', 'vacation.jpg')]);
    bridge.setChildren('folder-empty', []);
    bridge.setChildren('folder-trash', [
        trashedFile('report-deleted', 'report-deleted.pdf'),
        trashedFile('deleted-doc', 'deleted-doc.txt'),
        folder('folder-deep-trash', 'DeepTrash'),
    ]);
    bridge.setChildren('folder-deep-trash', [file('deep-deleted', 'deep-deleted.pdf')]);
}

function createBridge(): FakeMainThreadBridge {
    const b = new FakeMainThreadBridge();
    buildComplexTree(b);
    return b;
}

// --- Tests ---

describe('SharedWorkerAPI integration', () => {
    let api: SharedWorkerAPI;
    let bridge: FakeMainThreadBridge;
    let state: SearchModuleStateStream;

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.useFakeTimers({
            doNotFake: [
                'setImmediate', // fake-indexeddb uses setImmediate to resolve IDB operations
                'nextTick', // fake-indexeddb uses nextTick for transaction callbacks
                'queueMicrotask', // Promises/await chains need real microtask scheduling
            ],
        });
        // In memory indexedDB
        indexedDB = new IDBFactory();
        FakeBroadcastChannel.reset();
        api = new SharedWorkerAPI();
        bridge = createBridge();
        state = new SearchModuleStateStream();
    });

    afterEach(() => {
        state.close();
        api.disconnectClient(CLIENT_A);
        api.disconnectClient(CLIENT_B);
        jest.useRealTimers();
    });

    describe('Scenario: full bootstrap + search for MyFiles', () => {
        it('indexes files and makes them searchable', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            await verifyThatUserCanSearchIndexProperly(api);
        });
    });

    describe('Scenario: warm restart (page reload / new tab with existing DB)', () => {
        it('skips initial indexing and goes straight to searchable', async () => {
            // First boot: full initial indexing
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForInitialIndexingStart();
            await state.waitForSearchable();

            await verifyThatUserCanSearchIndexProperly(api);

            // Simulate page reload: disconnect, create fresh API + bridge + state stream
            // but keep the same IndexedDB (same IDBFactory, same USER_ID)
            api.disconnectClient(CLIENT_A);

            // Simulate reload: fresh API + bridge, same IndexedDB

            // First, forget about past states.
            state.checkpoint();

            api = new SharedWorkerAPI();
            const freshBridge = createBridge();

            // Second boot: DB already has populator state (done=true), so no initial indexing
            await api.registerClient(USER_ID, CLIENT_A, freshBridge.asBridge());
            await state.waitForSearchable();

            // Initial indexing should NOT have occurred
            state.expectNeverInitialIndexingSinceCheckpoint();

            // Search still works — index was persisted from first boot
            await verifyThatUserCanSearchIndexProperly(api);
        });
    });

    describe('Scenario: tree_refresh triggers re-index', () => {
        it('re-indexes and bumps generation', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());

            // Bootstrap: initial indexing starts
            await state.waitForInitialIndexingStart();

            // Bootstrap completes: searchable, no longer indexing
            const searchable = await state.waitForSearchable();
            expectState(searchable, { isIndexing: false, isInitialIndexing: false });

            // Verify documents are searchable after bootstrap
            await verifyThatUserCanSearchIndexProperly(api);

            const indexedResults = await getAllIndexedItemsForGeneration(api, 1);
            expect(indexedResults).toHaveLength(9);

            // Emit tree_refresh — will be picked up by IncrementalUpdateTask after 60s delay
            bridge.emitEvent(SCOPE_ID, { type: 'tree_refresh', eventId: 'evt-refresh' } as any);

            // Re-index starts (waitUntil advances fake timers automatically)
            await state.waitForIndexingStart();

            // Re-index completes
            await state.waitForIndexingEnd();

            // Documents are still searchable after re-index
            await verifyThatUserCanSearchIndexProperly(api);

            // Verify generation bumped — no results should remain from generation 1
            const staleResults = await getAllIndexedItemsForGeneration(api, 1);
            expect(staleResults).toHaveLength(0);

            const indexedResultsAfterRefresh = await getAllIndexedItemsForGeneration(api, 2);
            expect(indexedResultsAfterRefresh).toHaveLength(9);
        }, 15_000);
    });

    describe('Scenario: tab switching', () => {
        it('client B takes over when client A disconnects', async () => {
            const bridgeB = createBridge();

            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();
            await api.registerClient(USER_ID, CLIENT_B, bridgeB.asBridge());

            await verifyThatUserCanSearchIndexProperly(api);

            // Disconnect A — B becomes active
            state.checkpoint();
            api.disconnectClient(CLIENT_A);

            await state.waitForSearchable();
            await verifyThatUserCanSearchIndexProperly(api);
            state.expectNeverInitialIndexingSinceCheckpoint();
        }, 10_000);
    });

    describe('Scenario: permanent error', () => {
        it('quota exceeded stops the indexer', async () => {
            // Simulate IDB quota exceeded when writing index blobs
            jest.spyOn(SearchDB.prototype, 'putIndexBlob').mockRejectedValue(
                new DOMException('', 'QuotaExceededError')
            );
            // navigator.storage.estimate is called in the error handler for logging
            Object.defineProperty(navigator, 'storage', {
                value: { estimate: jest.fn().mockResolvedValue({ usage: 4_999, quota: 5_000 }) },
                configurable: true,
            });

            state.checkpoint();
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            const errorState = await state.waitForPermanentError();

            expectState(errorState, { permanentError: 'quota_exceeded', isSearchable: false });
            expect(await search(api, 'report')).toHaveLength(0);
            state.expectNeverSearchableSinceCheckpoint();
        });
    });

    // TODO: Add version upgrade scenario
    // TODO: Add incremental update scenario
    // TODO: Add shared_with_me scenarios: tree removed, tree added
    // TODO: Add volume changed after password recovery
    // TODO: Add DB corrupted scenario
    // TODO: every mainteance/cleanup/repair tasks
});
