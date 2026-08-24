import type { DriveEvent, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { DriveEventType } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { SearchDB } from '../shared/SearchDB';
import { SearchLibraryError } from '../shared/errors';
import type {
    ClientId,
    SearchModuleState,
    SearchResultItem,
    SerializedIndexEntry,
    TreeEventScopeId,
    UserId,
    WorkerIndexExportEvent,
    WorkerSearchResultEvent,
} from '../shared/types';
import { IndexKind } from '../shared/types';
import { FakeBroadcastChannel } from '../testing/FakeBroadcastChannel';
import { FakeMainThreadBridge } from '../testing/FakeMainThreadBridge';
import { setupRealSearchLibraryWasm } from '../testing/setupRealSearchLibraryWasm';
import { SharedWorkerAPI } from './SharedWorkerAPI';
import { IndexReader } from './index/IndexReader';

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
const SCOPE_ID_2 = 'scope-2' as TreeEventScopeId;
const STATE_CHANNEL = `search-state-${USER_ID}`;

// --- Node helpers ---

const folder = (uid: string, name: string) =>
    createMockNodeEntity({ uid, name: { ok: true, value: name }, type: 'folder' as NodeType.Folder });
const trashedFolder = (uid: string, name: string) =>
    createMockNodeEntity({
        uid,
        name: { ok: true, value: name },
        type: 'folder' as NodeType.Folder,
        trashTime: new Date(),
    });
const file = (uid: string, name: string) =>
    createMockNodeEntity({ uid, name: { ok: true, value: name }, type: 'file' as NodeType.File });
const trashedFile = (uid: string, name: string) =>
    createMockNodeEntity({
        uid,
        name: { ok: true, value: name },
        type: 'file' as NodeType.File,
        trashTime: new Date(),
    });

// Nodes with an explicit parent, registered via bridge.setNode so getNode() and parent-path
// resolution work during incremental updates. buildComplexTree only wires setChildren (which feeds
// the initial walk and iterateNodes), so incremental node events need these too.
const fileWithParent = (uid: string, name: string, parentUid?: string) =>
    createMockNodeEntity({ uid, name: { ok: true, value: name }, type: 'file' as NodeType.File, parentUid });
const folderWithParent = (uid: string, name: string, parentUid?: string) =>
    createMockNodeEntity({ uid, name: { ok: true, value: name }, type: 'folder' as NodeType.Folder, parentUid });

const nodeEvent = (
    type: DriveEventType.NodeCreated | DriveEventType.NodeUpdated | DriveEventType.NodeDeleted,
    nodeUid: string,
    parentNodeUid?: string
): DriveEvent =>
    ({
        type,
        nodeUid,
        parentNodeUid,
        eventId: `evt-${type}-${nodeUid}`,
        treeEventScopeId: SCOPE_ID,
        isTrashed: false,
        isShared: false,
    }) as DriveEvent;

// --- State stream ---

type StateMessage = Partial<SearchModuleState>;

// The index is ready to search once a full scan is no longer running and a usable index exists.
const isIndexReady = (s: StateMessage) => s.isIndexing === false && s.isSearchable === true;
// First-time build: a scan is running and no usable index exists yet.
const isBuildingFromScratch = (s: StateMessage) => s.isIndexing === true && s.isSearchable !== true;
// Background re-index: a scan is running while a usable index already exists (search stays available).
const isReindexing = (s: StateMessage) => s.isIndexing === true && s.isSearchable === true;

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
    // Broadcasts are partial patches; we merge them into the full state so every stored
    // entry is the real cumulative state (no synthetic fields).
    private merged: StateMessage = {};

    constructor() {
        this.channel = new FakeBroadcastChannel(STATE_CHANNEL);
        this.channel.onmessage = (ev: MessageEvent<StateMessage>) => {
            this.merged = { ...this.merged, ...ev.data };
            const msg: StateMessage = { ...this.merged };
            this.history.push(msg);
            const waiter = this.pending.shift();
            if (waiter) {
                waiter(msg);
            } else {
                this.buffer.push(msg);
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

    /** Most recent state observed since the last checkpoint (undefined if none yet). */
    private latestSinceCheckpoint(): StateMessage | undefined {
        const recent = this.sinceLastCheckpoint();
        return recent[recent.length - 1];
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
        const latest = this.latestSinceCheckpoint();
        expect(latest ? isBuildingFromScratch(latest) : false).toBe(false);
        return this.waitUntil(isBuildingFromScratch);
    }

    async waitForSearchable() {
        const latest = this.latestSinceCheckpoint();
        expect(latest ? isIndexReady(latest) : false).toBe(false);
        return this.waitUntil(isIndexReady);
    }

    async waitForReindexing() {
        return this.waitUntil(isReindexing);
    }

    async waitForPermanentError() {
        return this.waitUntil((msg) => msg.permanentError !== undefined && msg.permanentError !== null);
    }

    /** Assert no state updates received since the last checkpoint. */
    expectNoUpdatesSinceCheckpoint() {
        expect(this.sinceLastCheckpoint()).toHaveLength(0);
        expect(this.buffer).toHaveLength(0);
    }

    /** Assert the index never became ready to search since the last checkpoint. */
    expectNeverSearchableSinceCheckpoint() {
        expect(this.sinceLastCheckpoint().every((s) => !isIndexReady(s))).toBe(true);
    }

    /** Assert a from-scratch build never started since the last checkpoint. */
    expectNeverInitialIndexingSinceCheckpoint() {
        expect(this.sinceLastCheckpoint().every((s) => !isBuildingFromScratch(s))).toBe(true);
    }

    /** Assert a usable index stayed present (search remained possible) since the last checkpoint. */
    expectKeptSearchableIndexSinceCheckpoint() {
        expect(this.sinceLastCheckpoint().every((s) => s.isSearchable === true)).toBe(true);
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

// Incremental updates don't broadcast isIndexing, so there's no state edge to wait on. Drive the
// debounced IncrementalUpdateTask by advancing fake timers and poll search until the index reflects
// the change (tolerating brief writer-busy while a commit is in flight).
async function advanceUntilSearch(
    api: SharedWorkerAPI,
    query: string,
    predicate: (results: SearchResultItem[]) => boolean,
    maxIterations = 1000
): Promise<SearchResultItem[]> {
    for (let i = 0; i < maxIterations; i++) {
        try {
            const results = await search(api, query);
            if (predicate(results)) {
                return results;
            }
        } catch (e) {
            if (!(e instanceof Error) || !/write session|write handle/i.test(e.message)) {
                throw e;
            }
        }
        await jest.advanceTimersByTimeAsync(200);
    }
    throw new Error(`advanceUntilSearch('${query}') timed out`);
}

async function exportAll(api: SharedWorkerAPI, kind: IndexKind): Promise<SerializedIndexEntry[]> {
    const entries: SerializedIndexEntry[] = [];
    await api.exportIndexEntries(kind, (event: WorkerIndexExportEvent) => {
        if (event.type === 'entry') {
            entries.push({ identifier: event.identifier, attributes: event.attributes });
        }
    });
    return entries;
}

// The `path` attribute of an exported entry: the ancestor-uid chain, e.g. "/folder-a/folder-b".
function pathOf(entries: SerializedIndexEntry[], identifier: string): string | undefined {
    return entries.find((e) => e.identifier === identifier)?.attributes.path?.[0] as string | undefined;
}

// Like advanceUntilSearch, but polls the diagnostics export (used to observe the `path` attribute,
// which isn't returned by search results).
async function advanceUntilExport(
    api: SharedWorkerAPI,
    kind: IndexKind,
    predicate: (entries: SerializedIndexEntry[]) => boolean,
    maxIterations = 1000
): Promise<SerializedIndexEntry[]> {
    for (let i = 0; i < maxIterations; i++) {
        try {
            const entries = await exportAll(api, kind);
            if (predicate(entries)) {
                return entries;
            }
        } catch (e) {
            if (!(e instanceof Error) || !/write session|write handle/i.test(e.message)) {
                throw e;
            }
        }
        await jest.advanceTimersByTimeAsync(200);
    }
    throw new Error('advanceUntilExport timed out');
}

// Post-bootstrap cleanup tasks can hold the writer briefly. Retry with fake-timer advances
// until either the call succeeds or we give up. Used by tests that need an on-demand write.
async function retryWhileWriterBusy(fn: () => Promise<void>, maxIterations = 50): Promise<void> {
    for (let i = 0; i < maxIterations; i++) {
        try {
            await fn();
            return;
        } catch (e) {
            if (!(e instanceof Error) || !/write session|write handle/.test(e.message)) {
                throw e;
            }
            await jest.advanceTimersByTimeAsync(100);
        }
    }
    throw new Error('retryWhileWriterBusy: timed out');
}

// Poll the persisted repair table while advancing fake timers, until an entry for `nodeUid` appears.
async function advanceUntilRepairEntry(nodeUid: string, maxIterations = 1000): Promise<void> {
    const db = await SearchDB.open(USER_ID);
    try {
        for (let i = 0; i < maxIterations; i++) {
            const entries = await db.getAllRepairEntries();
            if (entries.some((e) => e.nodeUid === nodeUid)) {
                return;
            }
            await jest.advanceTimersByTimeAsync(200);
        }
    } finally {
        db.close();
    }
    throw new Error(`advanceUntilRepairEntry('${nodeUid}') timed out`);
}

// Poll the repair table until it is empty (an entry was cleared after a successful repair).
async function advanceUntilRepairTableEmpty(maxIterations = 100): Promise<void> {
    const db = await SearchDB.open(USER_ID);
    try {
        for (let i = 0; i < maxIterations; i++) {
            if ((await db.getAllRepairEntries()).length === 0) {
                return;
            }
            await jest.advanceTimersByTimeAsync(100);
        }
    } finally {
        db.close();
    }
    throw new Error('advanceUntilRepairTableEmpty timed out');
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
        createMockNodeEntity({
            uid: 'root-uid',
            name: { ok: true, value: 'My Files' },
            type: 'folder' as any,
            treeEventScopeId: SCOPE_ID,
        })
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
            expectState(searchable, { isIndexing: false, isSearchable: true });

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

    describe('Scenario: tree_remove tears down the scope', () => {
        it('removes the scope subscription, DB state, and all of its index entries', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Sanity: the scope is fully indexed and searchable.
            await verifyThatUserCanSearchIndexProperly(api);
            expect(await getAllIndexedItemsForGeneration(api, 1)).toHaveLength(9);

            // Emit tree_remove — picked up by the debounced IncrementalUpdateTask (~60s). It tears
            // down the scope: deletes the populator state (orphaning its entries) and unregisters the
            // subscription, then the handler enqueues CleanUpStaleIndexEntryTask which sweeps the
            // now-orphaned entries. Incremental work has no isIndexing state edge, so poll search.
            bridge.emitEvent(SCOPE_ID, {
                type: DriveEventType.TreeRemove,
                treeEventScopeId: SCOPE_ID,
                eventId: 'none',
            });

            // Poll until the scope's entries are gone from search.
            await advanceUntilSearch(api, 'report', (results) => results.length === 0);

            // The whole scope is gone from the index.
            expect(await search(api, 'notes')).toHaveLength(0);
            expect(await getAllIndexedItemsForGeneration(api, 1)).toHaveLength(0);

            // The SDK subscription was disposed and its persisted rows were deleted.
            expect(bridge.wasDisposed(SCOPE_ID)).toBe(true);
            const db = await SearchDB.open(USER_ID);
            expect(await db.getAllSubscriptions()).toHaveLength(0);
            expect(await db.getAllPopulatorStates()).toHaveLength(0);
            db.close();
        }, 15_000);
    });

    describe('Scenario: tree_remove then reload re-subscribes from the SDK', () => {
        it('re-derives the scope id from getMyFilesRootFolder and rebuilds the index on reload', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();
            await verifyThatUserCanSearchIndexProperly(api);

            // Remove the only scope, then wait until its entries are gone.
            bridge.emitEvent(SCOPE_ID, {
                type: DriveEventType.TreeRemove,
                treeEventScopeId: SCOPE_ID,
                eventId: 'none',
            });
            await advanceUntilSearch(api, 'report', (results) => results.length === 0);

            // Nothing about the scope is persisted anymore, so a reload can only learn the scope id
            // from the SDK, not from the search DB.
            const dbAfterRemove = await SearchDB.open(USER_ID);
            expect(await dbAfterRemove.getAllSubscriptions()).toHaveLength(0);
            expect(await dbAfterRemove.getAllPopulatorStates()).toHaveLength(0);
            dbAfterRemove.close();

            // Simulate reload: fresh API + bridge, same IndexedDB.
            api.disconnectClient(CLIENT_A);
            state.checkpoint();
            api = new SharedWorkerAPI();
            const freshBridge = createBridge();
            await api.registerClient(USER_ID, CLIENT_A, freshBridge.asBridge());

            // The scope is rebuilt from the SDK-provided root: its files are searchable again.
            await advanceUntilSearch(api, 'report', (results) => results.length === 3);
            await verifyThatUserCanSearchIndexProperly(api);

            // A fresh subscription was created for the SDK-derived scope id, even though the DB had none.
            const dbAfterReload = await SearchDB.open(USER_ID);
            const subs = await dbAfterReload.getAllSubscriptions();
            dbAfterReload.close();
            expect(subs.map((s) => s.treeEventScopeId)).toEqual([SCOPE_ID]);
        }, 15_000);

        it('subscribes to the new scope id when the SDK reports a different MyFiles root on reload', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Remove the only scope, then wait until its entries are gone.
            bridge.emitEvent(SCOPE_ID, {
                type: DriveEventType.TreeRemove,
                treeEventScopeId: SCOPE_ID,
                eventId: 'none',
            });
            await advanceUntilSearch(api, 'report', (results) => results.length === 0);

            // Simulate reload where the SDK now reports the MyFiles root under a DIFFERENT scope id.
            api.disconnectClient(CLIENT_A);
            state.checkpoint();
            api = new SharedWorkerAPI();
            const freshBridge = createBridge();
            freshBridge.setMyFilesRootNode(
                createMockNodeEntity({
                    uid: 'root-uid',
                    name: { ok: true, value: 'My Files' },
                    type: 'folder' as NodeType.Folder,
                    treeEventScopeId: SCOPE_ID_2,
                })
            );
            await api.registerClient(USER_ID, CLIENT_A, freshBridge.asBridge());

            // The index is rebuilt and searchable again under the new scope.
            await advanceUntilSearch(api, 'report', (results) => results.length === 3);
            await verifyThatUserCanSearchIndexProperly(api);

            // The subscription is for the new scope id only — the old one is not resurrected.
            const dbAfterReload = await SearchDB.open(USER_ID);
            const subs = await dbAfterReload.getAllSubscriptions();
            dbAfterReload.close();
            expect(subs.map((s) => s.treeEventScopeId)).toEqual([SCOPE_ID_2]);
        }, 15_000);
    });

    describe('Scenario: re-index keeps the existing index searchable', () => {
        it('re-indexes in the background without dropping searchability or showing a first-time build', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();
            await verifyThatUserCanSearchIndexProperly(api);

            // Observe only the re-index episode from here on.
            state.checkpoint();

            // Trigger a full re-index of the tree.
            bridge.emitEvent(SCOPE_ID, { type: 'tree_refresh', eventId: 'evt-refresh' } as any);

            // We enter a re-indexing state: scanning while a usable index already exists.
            const reindexing = await state.waitForReindexing();
            expectState(reindexing, { isIndexing: true, isSearchable: true });

            // Search is available *during* the re-index — the previous index is still queryable.
            const duringReindex = (await search(api, 'report')).map((r) => r.nodeUid);
            expect(duringReindex.length).toBeGreaterThan(0);

            // Re-index completes and we're back to ready.
            await state.waitForIndexingEnd();

            // Throughout the episode it was a re-index (never a first-time build) and the index
            // stayed usable the entire time, so search was never blocked.
            state.expectNeverInitialIndexingSinceCheckpoint();
            state.expectKeptSearchableIndexSinceCheckpoint();

            // Results are still correct after the re-index.
            await verifyThatUserCanSearchIndexProperly(api);
        }, 15_000);
    });

    describe('Scenario: explicit reindexPopulator re-index', () => {
        it('re-indexes the named populator while keeping search available', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Resolve the populator uid the way diagnostics would: read it from the DB.
            const db = await SearchDB.open(USER_ID);
            const [populator] = await db.getAllPopulatorStates();
            db.close();
            expect(populator).toBeDefined();

            state.checkpoint();

            await api.reindexPopulator(populator.uid);

            // Enters the re-indexing state, then completes back to ready.
            const reindexing = await state.waitForReindexing();
            expectState(reindexing, { isIndexing: true, isSearchable: true });
            await state.waitForIndexingEnd();

            // It was a re-index (never a first-time build) and stayed searchable throughout.
            state.expectNeverInitialIndexingSinceCheckpoint();
            state.expectKeptSearchableIndexSinceCheckpoint();

            await verifyThatUserCanSearchIndexProperly(api);
        }, 15_000);
    });

    describe('Scenario: stale entry cleanup after tree_refresh', () => {
        it('removes entries for nodes that disappear between indexing cycles', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Before re-index, old-report.pdf is searchable and everything is at generation 1.
            const before = (await search(api, 'old')).map((r) => r.nodeUid);
            expect(before).toContain('old-report');
            expect(await getAllIndexedItemsForGeneration(api, 1)).toHaveLength(9);

            // Simulate that:
            //   - the user was inactive for a long time, a tree_refresh is sent.
            //   - the 'folder-archive' folder is now empty: old-report was deleted (maybe on another device)
            bridge.setChildren('folder-archive', []);
            bridge.emitEvent(SCOPE_ID, { type: 'tree_refresh', eventId: 'evt-refresh' } as any);

            await state.waitForIndexingStart();
            await state.waitForIndexingEnd();

            // The cleanup task is enqueued after the re-index and runs afterwards,
            // so we can't assume it finished the moment isIndexing flips to false. Poll
            // generation-1 entries until the cleanup has removed them all.
            let genOne: SearchResultItem[] = [];
            for (let i = 0; i < 50; i++) {
                genOne = await getAllIndexedItemsForGeneration(api, 1);
                if (genOne.length === 0) {
                    break;
                }
                await jest.advanceTimersByTimeAsync(100);
            }
            expect(genOne).toHaveLength(0);

            // old-report is no longer searchable; the rest of the tree still is.
            const afterSearch = (await search(api, 'old')).map((r) => r.nodeUid);
            expect(afterSearch).not.toContain('old-report');
            const reports = (await search(api, 'report')).map((r) => r.nodeUid).sort();
            expect(reports).toEqual(['report-q1', 'report-q2']);
        }, 15_000);
    });

    describe('Scenario: bootstrap cleans stale entries from inactive tree scope', () => {
        it('removes entries whose tree scope is no longer active', async () => {
            const SCOPE_OLD = 'scope-old' as TreeEventScopeId;
            const SCOPE_NEW = 'scope-new' as TreeEventScopeId;

            // Boot 1: small tree rooted at SCOPE_OLD.
            const bridge1 = new FakeMainThreadBridge();
            bridge1.setMyFilesRootNode(
                createMockNodeEntity({
                    uid: 'root-1',
                    name: { ok: true, value: 'Root 1' },
                    type: 'folder' as any,
                    treeEventScopeId: SCOPE_OLD,
                })
            );
            bridge1.setChildren('root-1', [file('old-a', 'alpha.txt'), file('old-b', 'bravo.txt')]);

            await api.registerClient(USER_ID, CLIENT_A, bridge1.asBridge());
            await state.waitForSearchable();
            expect(await search(api, '', { treeEventScopeId: SCOPE_OLD })).toHaveLength(2);

            // Simulate a page reload where the My Files scope has changed (e.g. the
            // app reopens with a different root tree-event scope). Different node
            // uids so session.insert doesn't replace the old entries.
            api.disconnectClient(CLIENT_A);
            state.checkpoint();
            api = new SharedWorkerAPI();

            const bridge2 = new FakeMainThreadBridge();
            bridge2.setMyFilesRootNode(
                createMockNodeEntity({
                    uid: 'root-2',
                    name: { ok: true, value: 'Root 2' },
                    type: 'folder' as any,
                    treeEventScopeId: SCOPE_NEW,
                })
            );
            bridge2.setChildren('root-2', [file('new-c', 'charlie.txt'), file('new-d', 'delta.txt')]);

            await api.registerClient(USER_ID, CLIENT_A, bridge2.asBridge());
            await state.waitForSearchable();

            // Post-bootstrap cleanup runs after waitForSearchable returns; poll the
            // SCOPE_OLD entries until they're gone.
            let oldScopeResults: SearchResultItem[] = [];
            for (let i = 0; i < 50; i++) {
                oldScopeResults = await search(api, '', { treeEventScopeId: SCOPE_OLD });
                if (oldScopeResults.length === 0) {
                    break;
                }
                await jest.advanceTimersByTimeAsync(100);
            }
            expect(oldScopeResults).toHaveLength(0);

            // SCOPE_NEW entries remain searchable.
            const newScopeResults = await search(api, '', { treeEventScopeId: SCOPE_NEW });
            expect(newScopeResults.map((r) => r.nodeUid).sort()).toEqual(['new-c', 'new-d']);
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
            jest.spyOn(SearchDB.prototype, 'putEncryptedIndexBlob').mockRejectedValue(
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

    describe('Scenario: permanent error during a search query', () => {
        it('surfaces the rebuild banner even though search bypasses the task queue', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Indexing already succeeded; simulate a permanent WASM failure specific to the query
            // path, which - per SearchQueryExecutor's own doc comment - bypasses the task queue
            // entirely, so the indexer's own permanent-error handling never runs for it.
            jest.spyOn(IndexReader.prototype, 'execute').mockImplementation(async function* () {
                throw new SearchLibraryError('Search library WASM failed: query execute', new Error('boom'));
            });

            state.checkpoint();
            await expect(search(api, 'report')).rejects.toThrow(SearchLibraryError);

            const errorState = await state.waitForPermanentError();
            expectState(errorState, { permanentError: 'search_library_error' });
        });
    });

    describe('Scenario: queryIndexerState', () => {
        it('returns default state before any client registers', async () => {
            const result = await api.queryIndexerState();
            expect(result).toEqual({
                isIndexing: false,
                isSearchable: false,
                permanentError: null,
                indexPopulatorStatuses: [],
            });
        });

        it('returns searchable state after indexing completes', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            const result = await api.queryIndexerState();
            expect(result.isSearchable).toBe(true);
            expect(result.isIndexing).toBe(false);
        });
    });

    describe('Scenario: indexing progress broadcasts', () => {
        it('broadcasts per-populator progress during bootstrap and reports done at the end', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // While indexing, at least one broadcast should carry non-zero file/folder counts
            // for the MyFiles populator. The complex tree has 5 non-trashed files and 4 non-trashed
            // folders, so in-memory progress grows through the bootstrap loop.
            const maxFilesSeen = Math.max(
                ...state.history.map((msg) =>
                    Math.max(0, ...(msg.indexPopulatorStatuses ?? []).map((s) => s.progress.files))
                )
            );
            const maxFoldersSeen = Math.max(
                ...state.history.map((msg) =>
                    Math.max(0, ...(msg.indexPopulatorStatuses ?? []).map((s) => s.progress.folders))
                )
            );
            expect(maxFilesSeen).toBeGreaterThan(0);
            expect(maxFoldersSeen).toBeGreaterThan(0);

            // After bootstrap the populator is registered, marked done, and the persisted
            // progress reflects the exact non-trashed tree:
            //   files   : notes.txt, report-q1.pdf, report-q2.pdf, old-report.pdf, vacation.jpg
            //   folders : folder-projects, folder-photos, folder-empty, folder-archive
            const result = await api.queryIndexerState();
            expect(result.indexPopulatorStatuses).toHaveLength(1);
            expect(result.indexPopulatorStatuses[0]).toEqual({
                done: true,
                progress: { files: 5, folders: 4, albums: 0, photos: 0 },
            });
        });
    });

    describe('Scenario: reset (clear browser data)', () => {
        it('clears index and resets indexer state, then re-indexes after re-register', async () => {
            // Initial bootstrap
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();
            await verifyThatUserCanSearchIndexProperly(api);

            // Reset: clears DB and stops indexer, but does not auto-restart.
            state.checkpoint();
            await api.reset();

            // Verify: index empty, indexer state reset
            expect(await search(api, 'report')).toHaveLength(0);
            const afterReset = await api.queryIndexerState();
            expect(afterReset.isSearchable).toBe(false);

            // Simulate the main thread calling start() after the user opts back in.
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());

            await state.waitForInitialIndexingStart();
            await state.waitForSearchable();

            await verifyThatUserCanSearchIndexProperly(api);
        });
    });

    describe('Scenario: duplicate registerClient is a noop', () => {
        it('does not re-index when the same client registers twice', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForInitialIndexingStart();
            await state.waitForSearchable();
            await verifyThatUserCanSearchIndexProperly(api);

            // Re-registering the same client should not trigger another indexing cycle.
            state.checkpoint();
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());

            // Give it a moment — if re-indexing were triggered we'd see isIndexing: true.
            await jest.advanceTimersByTimeAsync(1_000);
            state.expectNoUpdatesSinceCheckpoint();

            // Search still works with the existing index.
            await verifyThatUserCanSearchIndexProperly(api);
        });
    });

    describe('Scenario: diagnostics export / byte-size / remove', () => {
        it('exportIndexEntries streams every entry with typed attributes', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            const entries = await exportAll(api, IndexKind.MAIN);
            const ids = entries.map((e) => e.identifier);

            // Non-trashed nodes walked from the root must all be present.
            for (const expected of [
                'folder-archive',
                'folder-empty',
                'folder-photos',
                'folder-projects',
                'notes',
                'old-report',
                'report-q1',
                'report-q2',
                'vacation',
            ]) {
                expect(ids).toContain(expected);
            }

            // Every entry carries the core classification attributes with the right primitive types.
            for (const e of entries) {
                const [populatorKind] = e.attributes.indexPopulatorKind ?? [];
                const [generation] = e.attributes.indexPopulatorGeneration ?? [];
                expect(typeof populatorKind).toBe('string');
                expect(['number', 'bigint']).toContain(typeof generation);
            }
        });

        it('emits a final done event even when the index is empty', async () => {
            // No client registered — no indexer, nothing to export.
            const events: WorkerIndexExportEvent[] = [];
            await api.exportIndexEntries(IndexKind.MAIN, (event) => events.push(event));
            expect(events).toEqual([{ type: 'done' }]);
        });

        it('getIndexByteSize returns the ciphertext byte total for the kind', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            const size = await api.getIndexByteSize(IndexKind.MAIN);
            expect(size).toBeGreaterThan(0);

            // An unknown kind should report 0 — no blobs written under that key prefix.
            expect(await api.getIndexByteSize('nonexistent-kind' as IndexKind)).toBe(0);
        });

        it('removeIndexEntry deletes the entry and it disappears from exports and search', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Sanity: the entry exists in the export and is searchable.
            const before = (await exportAll(api, IndexKind.MAIN)).map((e) => e.identifier);
            expect(before).toContain('notes');
            const searchBefore = (await search(api, 'notes')).map((r) => r.nodeUid);
            expect(searchBefore).toContain('notes');

            // Post-bootstrap cleanup tasks may still be driving a write session;
            // retry briefly so the writer is free by the time we call removeIndexEntry.
            await retryWhileWriterBusy(() => api.removeIndexEntry(IndexKind.MAIN, 'notes'));

            const after = (await exportAll(api, IndexKind.MAIN)).map((e) => e.identifier);
            expect(after).not.toContain('notes');
            const searchAfter = (await search(api, 'notes')).map((r) => r.nodeUid);
            expect(searchAfter).not.toContain('notes');
        });
    });

    describe('Scenario: incremental updates', () => {
        it('node_created makes a new file searchable', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // A new report is created under Projects. getNode + parent-path resolution read setNode.
            bridge.setNode('root-uid', folderWithParent('root-uid', 'My Files'));
            bridge.setNode('folder-projects', folderWithParent('folder-projects', 'Projects', 'root-uid'));
            bridge.setNode('report-q3', fileWithParent('report-q3', 'report-q3.pdf', 'folder-projects'));

            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeCreated, 'report-q3', 'folder-projects'));

            const results = await advanceUntilSearch(api, 'report', (r) => r.some((x) => x.nodeUid === 'report-q3'));
            expect(results.map((r) => r.nodeUid).sort()).toEqual(['old-report', 'report-q1', 'report-q2', 'report-q3']);
        }, 15_000);

        it('node_updated on a folder re-indexes its subtree: adds new children and sweeps vanished ones', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            const initial = (await search(api, 'report')).map((r) => r.nodeUid).sort();
            expect(initial).toEqual(['old-report', 'report-q1', 'report-q2']);

            // Projects contents change: report-q2 removed, report-q3 added (archive/old-report kept).
            // The backend sends only the folder event, so the subtree is re-walked from the SDK.
            bridge.setNode('root-uid', folderWithParent('root-uid', 'My Files'));
            bridge.setNode('folder-projects', folderWithParent('folder-projects', 'Projects', 'root-uid'));
            bridge.setChildren('folder-projects', [
                file('report-q1', 'report-q1.pdf'),
                file('report-q3', 'report-q3.pdf'),
                folder('folder-archive', 'Archive'),
            ]);

            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeUpdated, 'folder-projects', 'root-uid'));

            // q1 kept (re-stamped), q3 added, q2 swept by the epoch GC, old-report re-walked (survives).
            const results = await advanceUntilSearch(api, 'report', (r) => {
                const ids = r.map((x) => x.nodeUid);
                return ids.includes('report-q3') && !ids.includes('report-q2');
            });
            expect(results.map((r) => r.nodeUid).sort()).toEqual(['old-report', 'report-q1', 'report-q3']);
        }, 15_000);

        it('node_deleted removes the node and its descendants', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            expect((await search(api, 'vacation')).map((r) => r.nodeUid)).toEqual(['vacation']);

            // Deleting the Photos folder takes its descendants with it (no per-descendant events).
            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeDeleted, 'folder-photos'));

            await advanceUntilSearch(api, 'vacation', (r) => r.length === 0);
            expect(await search(api, 'vacation')).toHaveLength(0);
        }, 15_000);

        it('deleting a folder removes all of its nested files and folders from the index', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Ids are shaped like real production node ids (mixed case, with a ~ in them) rather
            // than the plain lowercase ids used elsewhere in this file, so this test actually
            // covers ids that look like what Drive really sends.
            const folderUid = 'vol1~FolderUploads';
            const reportUid = 'vol1~UploadReport';
            const invoiceUid = 'vol1~UploadInvoice';
            const archiveFolderUid = 'vol1~FolderArchive';
            const archivedNoteUid = 'vol1~ArchivedNote';

            bridge.setNode('root-uid', folderWithParent('root-uid', 'My Files'));
            bridge.setNode(folderUid, folderWithParent(folderUid, 'Uploads', 'root-uid'));
            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeCreated, folderUid, 'root-uid'));

            // The folder holds two files and a nested subfolder with a file of its own, so removal
            // has to reach more than one level deep, not just the folder's direct children.
            bridge.setChildren(folderUid, [
                file(reportUid, 'report.pdf'),
                file(invoiceUid, 'invoice.pdf'),
                folder(archiveFolderUid, 'Archive'),
            ]);
            bridge.setChildren(archiveFolderUid, [file(archivedNoteUid, 'note.txt')]);
            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeUpdated, folderUid, 'root-uid'));

            const before = await advanceUntilExport(api, IndexKind.MAIN, (entries) =>
                entries.some((e) => e.identifier === archivedNoteUid)
            );
            expect(before.map((e) => e.identifier)).toEqual(
                expect.arrayContaining([folderUid, reportUid, invoiceUid, archiveFolderUid, archivedNoteUid])
            );

            // Now delete the folder - everything nested inside it should disappear too.
            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeDeleted, folderUid));

            const after = await advanceUntilExport(
                api,
                IndexKind.MAIN,
                (entries) => !entries.some((e) => e.identifier === folderUid)
            );
            const afterIds = after.map((e) => e.identifier);
            expect(afterIds).not.toContain(folderUid);
            expect(afterIds).not.toContain(reportUid);
            expect(afterIds).not.toContain(invoiceUid);
            expect(afterIds).not.toContain(archiveFolderUid);
            expect(afterIds).not.toContain(archivedNoteUid);
        }, 15_000);

        it('node_updated moves an entire subtree and re-paths every descendant', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Before the move: Projects sits at the root, so its subtree is anchored under it.
            const before = await exportAll(api, IndexKind.MAIN);
            expect(pathOf(before, 'folder-projects')).toBe('');
            expect(pathOf(before, 'report-q1')).toBe('/folder-projects');
            expect(pathOf(before, 'folder-archive')).toBe('/folder-projects');
            expect(pathOf(before, 'old-report')).toBe('/folder-projects/folder-archive');

            // Move Projects (with its whole subtree) under a new Destination folder. Only the top
            // folder event is emitted; the subtree must be re-walked and every descendant re-pathed.
            bridge.setNode('root-uid', folderWithParent('root-uid', 'My Files'));
            bridge.setNode('folder-dest', folderWithParent('folder-dest', 'Destination', 'root-uid'));
            bridge.setNode('folder-projects', folderWithParent('folder-projects', 'Projects', 'folder-dest'));

            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeUpdated, 'folder-projects', 'folder-dest'));

            // After the move: paths are rebased under /folder-dest/folder-projects/...
            const after = await advanceUntilExport(
                api,
                IndexKind.MAIN,
                (entries) => pathOf(entries, 'old-report') === '/folder-dest/folder-projects/folder-archive'
            );
            expect(pathOf(after, 'folder-projects')).toBe('/folder-dest');
            expect(pathOf(after, 'report-q1')).toBe('/folder-dest/folder-projects');
            expect(pathOf(after, 'folder-archive')).toBe('/folder-dest/folder-projects');
            expect(pathOf(after, 'old-report')).toBe('/folder-dest/folder-projects/folder-archive');

            // The moved files are still searchable — nothing lost or duplicated.
            expect((await search(api, 'report')).map((r) => r.nodeUid).sort()).toEqual([
                'old-report',
                'report-q1',
                'report-q2',
            ]);
        }, 15_000);
    });

    describe('Scenario: repair table heals a quarantined node on next startup', () => {
        it('re-indexes a node that failed during an incremental update, once it can be fetched again', async () => {
            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // A new file is created under Projects, but it can't be decrypted yet. A node that
            // cannot be loaded fails both fetch paths, so both are armed. The node and its parent
            // chain are registered so the only failure is the (recoverable) decryption of
            // report-q3 itself.
            bridge.setNode('root-uid', folderWithParent('root-uid', 'My Files'));
            bridge.setNode('folder-projects', folderWithParent('folder-projects', 'Projects', 'root-uid'));
            bridge.setNode('report-q3', fileWithParent('report-q3', 'report-q3.pdf', 'folder-projects'));
            bridge.setGetNodeError('report-q3', new Error('failed to decrypt node report-q3'));
            bridge.setIterateNodesError('report-q3', new Error('failed to decrypt node report-q3'));

            bridge.emitEvent(SCOPE_ID, nodeEvent(DriveEventType.NodeCreated, 'report-q3', 'folder-projects'));

            // The incremental update quarantines report-q3 and advances past it; it isn't searchable.
            await advanceUntilRepairEntry('report-q3');
            expect((await search(api, 'report')).map((r) => r.nodeUid)).not.toContain('report-q3');

            // Decryption recovers, then a warm restart (same DB) runs the bootstrap repair pass.
            bridge.clearGetNodeError('report-q3');
            bridge.clearIterateNodesError('report-q3');
            api.disconnectClient(CLIENT_A);
            state.checkpoint();
            api = new SharedWorkerAPI();

            await api.registerClient(USER_ID, CLIENT_A, bridge.asBridge());
            await state.waitForSearchable();

            // Initial indexing is skipped (already done), so report-q3 can only reappear via the
            // repair table task enqueued at bootstrap replaying the quarantined entry.
            state.expectNeverInitialIndexingSinceCheckpoint();
            const results = await advanceUntilSearch(api, 'report', (r) => r.some((x) => x.nodeUid === 'report-q3'));
            expect(results.map((r) => r.nodeUid).sort()).toEqual(['old-report', 'report-q1', 'report-q2', 'report-q3']);

            // The entry is cleared once the node is successfully re-indexed.
            await advanceUntilRepairTableEmpty();
        }, 20_000);
    });

    // TODO: Add version upgrade scenario
    // TODO: Add shared_with_me scenarios: tree removed, tree added
    // TODO: Add volume changed after password recovery
    // TODO: Add DB corrupted scenario
});
