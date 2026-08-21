import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { NodeEntity, NodeEvent } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { NodeType } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { SearchDB } from '../../../shared/SearchDB';
import { RepairableNodeError, SearchLibraryError, classifyError } from '../../../shared/errors';
import type { TreeEventScopeId } from '../../../shared/types';
import { FakeMainThreadBridge } from '../../../testing/FakeMainThreadBridge';
import { findDocumentsByTag } from '../../../testing/indexHelpers';
import { makeTaskContext } from '../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../index/IndexRegistry';
import type { IndexEntry } from '../indexEntry';
import { NodeTreeIndexPopulator } from './NodeTreeIndexPopulator';

setupRealSearchLibraryWasm();

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Omit<Partial<NodeEntity>, 'name'> & { name?: string } = {}): NodeEntity => {
    const { name, ...rest } = overrides;
    return createMockNodeEntity({
        ...rest,
        ...(name !== undefined ? { name: { ok: true, value: name } } : {}),
    });
};

class TestNodeTreePopulator extends NodeTreeIndexPopulator {
    constructor(private readonly rootUid: string) {
        super(SCOPE_ID, IndexKind.MAIN, 'test-populator', 1);
    }

    protected async getRootNodeUid(): Promise<string> {
        return this.rootUid;
    }
}

async function collectEntries(gen: AsyncIterableIterator<IndexEntry>): Promise<IndexEntry[]> {
    const entries: IndexEntry[] = [];
    for await (const entry of gen) {
        entries.push(entry);
    }
    return entries;
}

describe('NodeTreeIndexPopulator integration', () => {
    let bridge: FakeMainThreadBridge;

    beforeEach(() => {
        bridge = new FakeMainThreadBridge();
    });

    it('yields entries for a flat folder', async () => {
        bridge.setChildren('root', [
            makeMaybeNode({ uid: 'file-1', name: 'doc1.pdf', type: 'file' as any }),
            makeMaybeNode({ uid: 'file-2', name: 'doc2.pdf', type: 'file' as any }),
            makeMaybeNode({ uid: 'file-3', name: 'doc3.pdf', type: 'file' as any }),
        ]);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(3);
        expect(entries.map((e) => e.documentId)).toEqual(['file-1', 'file-2', 'file-3']);
    });

    it('traverses nested folders BFS: basic', async () => {
        bridge.setChildren('root', [makeMaybeNode({ uid: 'folder-a', name: 'FolderA', type: 'folder' as any })]);
        bridge.setChildren('folder-a', [makeMaybeNode({ uid: 'file-deep', name: 'deep.txt', type: 'file' as any })]);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(2);
        expect(entries[0].documentId).toBe('folder-a');
        expect(entries[1].documentId).toBe('file-deep');

        // Check parent path for deep file
        const pathAttr = entries[1].attributes.find((a) => a.name === 'path');
        expect(pathAttr?.value).toEqual({ kind: 'tag', value: '/folder-a' });
    });

    it('traverses a complex nested tree in BFS order with correct paths', async () => {
        // root/
        // ├── folder-a/
        // │   ├── file-a1.txt
        // │   ├── folder-a-nested/
        // │   │   ├── file-a-deep.pdf
        // │   │   ├── folder-a-deep-nested/
        // │   │   │   └── file-a-deepest.doc
        // │   │   └── folder-b-deep-nested-trashed/
        // │   │       └── file-b-deepest.doc
        // │   └── file-a2.txt
        // ├── folder-b/
        // │   └── file-b1.jpg
        // ├── file-root1.txt
        // └── folder-empty/

        const folder = (uid: string, name: string) => makeMaybeNode({ uid, name, type: 'folder' as any });
        const trashedFolder = (uid: string, name: string) =>
            makeMaybeNode({ uid, name, type: 'folder' as any, trashTime: new Date() });
        const file = (uid: string, name: string) => makeMaybeNode({ uid, name, type: 'file' as any });

        bridge.setChildren('root', [
            folder('folder-a', 'FolderA'),
            folder('folder-b', 'FolderB'),
            file('file-root1', 'root1.txt'),
            folder('folder-empty', 'Empty'),
        ]);
        bridge.setChildren('folder-a', [
            file('file-a1', 'a1.txt'),
            folder('folder-a-nested', 'Nested'),
            file('file-a2', 'a2.txt'),
        ]);
        bridge.setChildren('folder-a-nested', [
            file('file-a-deep', 'deep.pdf'),
            folder('folder-a-deep-nested', 'DeepNested'),
            trashedFolder('folder-b-deep-nested-trashed', 'TrashedFolder'),
        ]);
        bridge.setChildren('folder-a-deep-nested', [file('file-a-deepest', 'deepest.doc')]);
        bridge.setChildren('folder-b-deep-nested-trashed', [file('file-b-deepest', 'shouldNotAppear.doc')]);
        bridge.setChildren('folder-b', [file('file-b1', 'b1.jpg')]);
        bridge.setChildren('folder-empty', []);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        const pathOf = (entry: IndexEntry) => entry.attributes.find((a) => a.name === 'path')?.value;

        // BFS order: root children first (sorted by UID), then folder-a children, etc.
        // UIDs within each level are sorted alphabetically (deterministic for crash-resume).
        const ids = entries.map((e) => e.documentId);
        expect(ids).toEqual([
            'file-root1',
            'folder-a',
            'folder-b',
            'folder-empty',
            'file-a1',
            'file-a2',
            'folder-a-nested',
            'file-b1',
            'file-a-deep',
            'folder-a-deep-nested',
            'file-a-deepest',
        ]);

        // Verify paths at each depth
        expect(pathOf(entries[ids.indexOf('file-root1')])).toEqual({ kind: 'tag', value: '' });
        expect(pathOf(entries[ids.indexOf('file-a1')])).toEqual({ kind: 'tag', value: '/folder-a' });
        expect(pathOf(entries[ids.indexOf('file-a-deep')])).toEqual({
            kind: 'tag',
            value: '/folder-a/folder-a-nested',
        });
        expect(pathOf(entries[ids.indexOf('file-a-deepest')])).toEqual({
            kind: 'tag',
            value: '/folder-a/folder-a-nested/folder-a-deep-nested',
        });
        expect(pathOf(entries[ids.indexOf('file-b1')])).toEqual({ kind: 'tag', value: '/folder-b' });

        // Trashed folder and its children are excluded
        expect(ids).not.toContain('folder-b-deep-nested-trashed');
        expect(ids).not.toContain('file-b-deepest');
    });

    it('skips trashed nodes', async () => {
        bridge.setChildren('root', [
            makeMaybeNode({ uid: 'file-ok', name: 'ok.txt', type: 'file' as any }),
            makeMaybeNode({ uid: 'file-trashed', name: 'trashed.txt', type: 'file' as any, trashTime: new Date() }),
        ]);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(1);
        expect(entries[0].documentId).toBe('file-ok');
    });

    it('respects abort signal', async () => {
        bridge.setChildren('root', [makeMaybeNode({ uid: 'file-1', name: 'doc.pdf', type: 'file' as any })]);

        const ac = new AbortController();
        ac.abort();
        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), signal: ac.signal });

        await expect(collectEntries(populator.visitAndProduceIndexEntries(ctx))).rejects.toThrow();
    });

    it('sets correct treeEventScopeId on entries', async () => {
        bridge.setChildren('root', [makeMaybeNode({ uid: 'file-1', name: 'doc.pdf', type: 'file' as any })]);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        const attr = entries[0].attributes.find((a) => a.name === 'treeEventScopeId');
        expect(attr?.value).toEqual({ kind: 'tag', value: SCOPE_ID });
    });

    it('sets correct indexPopulatorGeneration', async () => {
        bridge.setChildren('root', [makeMaybeNode({ uid: 'file-1', name: 'doc.pdf', type: 'file' as any })]);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        const attr = entries[0].attributes.find((a) => a.name === 'indexPopulatorGeneration');
        expect(attr?.value).toEqual({ kind: 'integer', value: BigInt(1) });
    });

    it('indexes nodes without indexable filenames using fallback name', async () => {
        const degradedNoName: NodeEntity = createMockNodeEntity({
            uid: 'bad-node',
            name: { ok: false, error: new Error('decrypt failed') },
            type: 'file' as any,
        });

        bridge.setChildren('root', [
            makeMaybeNode({ uid: 'file-ok', name: 'ok.txt', type: 'file' as any }),
            degradedNoName,
        ]);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(2);
        // UIDs sorted alphabetically: bad-node < file-ok
        expect(entries[0].documentId).toBe('bad-node');
        expect(entries[1].documentId).toBe('file-ok');
    });
});

// Stubs processNodeMutation so the quarantine/self-heal logic in processIncrementalUpdates can be
// exercised without the real index engine. `failures` maps a node UID to the error to throw for it.
// Use a RepairableNodeError to simulate a node-scoped failure (quarantined); any other error is
// treated as systemic (re-thrown, not quarantined).
class StubMutationPopulator extends NodeTreeIndexPopulator {
    readonly processedUids: string[] = [];

    constructor(private readonly failures: Map<string, unknown>) {
        super(SCOPE_ID, IndexKind.MAIN, 'test-populator', 1);
    }

    protected async getRootNodeUid(): Promise<string> {
        return 'root';
    }

    async processNodeMutation(event: NodeEvent): Promise<void> {
        const failure = this.failures.get(event.nodeUid);
        if (failure) {
            throw failure;
        }
        this.processedUids.push(event.nodeUid);
    }
}

// `type` is a string enum on the SDK NodeEvent union that isn't re-exported as a value, so build
// via a cast - matching the makeNodeEvent helper in IndexPopulator.test.ts.
const nodeCreated = (nodeUid: string, eventId: string): NodeEvent =>
    ({
        type: 'node_created',
        nodeUid,
        parentNodeUid: 'root',
        isTrashed: false,
        isShared: false,
        treeEventScopeId: SCOPE_ID,
        eventId,
    }) as unknown as NodeEvent;

const nodeDeleted = (nodeUid: string, eventId: string): NodeEvent =>
    ({
        type: 'node_deleted',
        nodeUid,
        parentNodeUid: 'root',
        treeEventScopeId: SCOPE_ID,
        eventId,
    }) as unknown as NodeEvent;

const nodeUpdated = (nodeUid: string, eventId: string): NodeEvent =>
    ({
        type: 'node_updated',
        nodeUid,
        parentNodeUid: 'root',
        isTrashed: false,
        isShared: false,
        treeEventScopeId: SCOPE_ID,
        eventId,
    }) as unknown as NodeEvent;

const nodeTrashed = (nodeUid: string, eventId: string): NodeEvent =>
    ({
        type: 'node_updated',
        nodeUid,
        parentNodeUid: undefined,
        isTrashed: true,
        isShared: false,
        treeEventScopeId: SCOPE_ID,
        eventId,
    }) as unknown as NodeEvent;

describe('NodeTreeIndexPopulator incremental quarantine', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
    });

    it('quarantines a node-scoped failure, advances the cursor, and keeps processing later events', async () => {
        const populator = new StubMutationPopulator(new Map([['b', new RepairableNodeError('decrypt failed', null)]]));
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });

        const processed = await populator.processIncrementalUpdates(
            [nodeCreated('a', 'e1'), nodeCreated('b', 'e2'), nodeCreated('c', 'e3')],
            ctx
        );

        // All three events consumed (cursor advances past the broken one) - only a and c indexed.
        expect(processed).toBe(3);
        expect(populator.processedUids).toEqual(['a', 'c']);

        const repairs = await db.getAllRepairEntries();
        expect(repairs).toHaveLength(1);
        expect(repairs[0]).toMatchObject({ nodeUid: 'b', operation: 'index', parentNodeUid: 'root' });
        expect(repairs[0].lastError).toContain('decrypt failed');
    });

    it('records a node_deleted failure with operation "remove"', async () => {
        const populator = new StubMutationPopulator(new Map([['x', new RepairableNodeError('boom', null)]]));
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });

        await populator.processIncrementalUpdates([nodeDeleted('x', 'e1')], ctx);

        const repairs = await db.getAllRepairEntries();
        expect(repairs[0]).toMatchObject({ nodeUid: 'x', operation: 'remove' });
    });

    it('re-throws a systemic failure and does not quarantine (cursor stays stuck at the prefix)', async () => {
        const populator = new StubMutationPopulator(new Map([['b', new SearchLibraryError('wasm exploded', null)]]));
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });

        await expect(
            populator.processIncrementalUpdates(
                [nodeCreated('a', 'e1'), nodeCreated('b', 'e2'), nodeCreated('c', 'e3')],
                ctx
            )
        ).rejects.toThrow('wasm exploded');

        expect(populator.processedUids).toEqual(['a']);
        expect(await db.getAllRepairEntries()).toHaveLength(0);
    });

    it('clears a repair entry when a previously-quarantined node later processes successfully', async () => {
        await db.putRepairEntry({
            nodeUid: 'b',
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'test-populator',
            treeEventScopeId: SCOPE_ID,
            operation: 'index',
            parentNodeUid: 'root',
            attempts: 2,
            firstFailedAt: 1,
            lastAttemptAt: 1,
            nextAttemptAt: 1,
        });

        const populator = new StubMutationPopulator(new Map());
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });

        const processed = await populator.processIncrementalUpdates([nodeCreated('b', 'e1')], ctx);

        expect(processed).toBe(1);
        expect(populator.processedUids).toEqual(['b']);
        expect(await db.getAllRepairEntries()).toHaveLength(0);
    });
});

describe('NodeTreeIndexPopulator descendant removal', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        indexRegistry = new IndexRegistry(await generateAndImportKey());
    });

    // Walks the tree from `rootUid` (mirrors the initial-indexing walk) and writes the resulting
    // entries into a real index, so the descendant query below runs against actual WASM data.
    async function indexTree(rootUid: string) {
        const populator = new TestNodeTreePopulator(rootUid);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db, indexRegistry });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        const { indexWriter } = await indexRegistry.get(IndexKind.MAIN, db);
        const session = indexWriter.startWriteSession();
        for (const entry of entries) {
            session.insert(entry);
        }
        await session.commit();

        return { populator, ctx };
    }

    async function allIndexedIds(): Promise<string[]> {
        const { indexReader } = await indexRegistry.get(IndexKind.MAIN, db);
        // Every entry from this populator carries this constant tag, so it's a stand-in for "match all".
        return (await findDocumentsByTag(indexReader, 'indexPopulatorKind', 'test-populator')).map((r) => r.identifier);
    }

    it('node_deleted removes a nested descendant', async () => {
        const folderUid = 'vol1~FolderA1';
        const fileUid = 'vol1~FileA1';
        // Sibling folder sharing the same volumeId prefix before the `~`, to prove the descendant
        // query isn't dissolving into an over-broad match on that shared prefix.
        const siblingFolderUid = 'vol1~FolderB1';
        const siblingFileUid = 'vol1~FileB1';

        bridge.setChildren('root', [
            makeMaybeNode({ uid: folderUid, name: 'FolderA', type: 'folder' as any }),
            makeMaybeNode({ uid: siblingFolderUid, name: 'FolderB', type: 'folder' as any }),
        ]);
        bridge.setChildren(folderUid, [makeMaybeNode({ uid: fileUid, name: 'a.txt', type: 'file' as any })]);
        bridge.setChildren(siblingFolderUid, [
            makeMaybeNode({ uid: siblingFileUid, name: 'b.txt', type: 'file' as any }),
        ]);

        const { populator, ctx } = await indexTree('root');
        expect(await allIndexedIds()).toEqual(
            expect.arrayContaining([folderUid, fileUid, siblingFolderUid, siblingFileUid])
        );

        await populator.processNodeMutation(nodeDeleted(folderUid, 'e1'), ctx);

        const remaining = await allIndexedIds();
        expect(remaining).not.toContain(folderUid);
        expect(remaining).not.toContain(fileUid);
        // The sibling subtree (same volumeId, different nodeUid) must survive untouched.
        expect(remaining).toContain(siblingFolderUid);
        expect(remaining).toContain(siblingFileUid);
    });

    it('node_updated on a trashed folder removes its descendants', async () => {
        const folderUid = 'vol1~FolderC1';
        const fileUid = 'vol1~FileC1';

        bridge.setChildren('root', [makeMaybeNode({ uid: folderUid, name: 'FolderC', type: 'folder' as any })]);
        bridge.setChildren(folderUid, [makeMaybeNode({ uid: fileUid, name: 'c.txt', type: 'file' as any })]);

        const { populator, ctx } = await indexTree('root');
        expect(await allIndexedIds()).toEqual(expect.arrayContaining([folderUid, fileUid]));

        // The backend reports the folder itself as trashed; no per-descendant event is sent.
        bridge.setNode(folderUid, makeMaybeNode({ uid: folderUid, name: 'FolderC', type: 'folder' as any }));
        await populator.processNodeMutation(nodeTrashed(folderUid, 'e1'), ctx);

        const remaining = await allIndexedIds();
        expect(remaining).not.toContain(fileUid);
    });

    it('a quota failure during removal keeps its quota_exceeded classification', async () => {
        const folderUid = 'vol1~FolderD1';
        bridge.setChildren('root', [makeMaybeNode({ uid: folderUid, name: 'FolderD', type: 'folder' as any })]);

        const { populator, ctx } = await indexTree('root');

        const { blobStore } = await indexRegistry.get(IndexKind.MAIN, db);
        jest.spyOn(blobStore, 'saveEvent').mockRejectedValue(new DOMException('', 'QuotaExceededError'));

        const error = await populator.processNodeMutation(nodeDeleted(folderUid, 'e1'), ctx).catch((e: unknown) => e);

        // Deliberately NOT search_library_error: the engine is fine, the disk is full. Only the
        // quota bucket gives the user the "free up storage" copy, and search_library_error must
        // stay the signal for real WASM faults.
        expect(classifyError(error)).toEqual({ kind: 'permanent', reason: 'quota_exceeded' });
    });

    it('a raw SDK error deep in the subtree walk propagates instead of quarantining the anchor folder', async () => {
        const folderUid = 'vol1~FolderE1';
        bridge.setChildren('root', [makeMaybeNode({ uid: folderUid, name: 'FolderE', type: 'folder' as any })]);

        const { populator, ctx } = await indexTree('root');

        bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
        bridge.setNode(folderUid, makeMaybeNode({ uid: folderUid, name: 'FolderE', type: 'folder' as any }));
        bridge.failNextIterateForFolder(folderUid, new Error('children listing failed'));

        await expect(populator.processIncrementalUpdates([nodeUpdated(folderUid, 'e1')], ctx)).rejects.toThrow(
            'children listing failed'
        );
        expect(await db.getAllRepairEntries()).toHaveLength(0);
    });

    it('clears an existing repair entry when the node turns out to be gone', async () => {
        const fileUid = 'vol1~FileF1';
        bridge.setChildren('root', [makeMaybeNode({ uid: fileUid, name: 'f.txt', type: 'file' as any })]);

        const { populator, ctx } = await indexTree('root');
        expect(await allIndexedIds()).toContain(fileUid);

        // Deleted server-side after being indexed: dropping it from the tree is what makes
        // iterateNodes report it missing (the fake falls back to scanning the tree by uid).
        bridge.setChildren('root', []);

        // It was also quarantined by an earlier failure.
        await db.putRepairEntry({
            nodeUid: fileUid,
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'test-populator',
            treeEventScopeId: SCOPE_ID,
            operation: 'index',
            parentNodeUid: 'root',
            attempts: 1,
            firstFailedAt: 1,
            lastAttemptAt: 1,
            nextAttemptAt: 1,
        });

        const processed = await populator.processIncrementalUpdates([nodeUpdated(fileUid, 'e1')], ctx);

        // Removed from the index and dropped from the repair table in the same pass, instead of
        // being re-quarantined and waiting for the next 24h repair cycle.
        expect(processed).toBe(1);
        expect(await allIndexedIds()).not.toContain(fileUid);
        expect(await db.getAllRepairEntries()).toHaveLength(0);
    });

    it('surfaces a repair fetch failure as node-scoped so one entry cannot abort the whole pass', async () => {
        const fileUid = 'vol1~FileG1';
        bridge.setChildren('root', [makeMaybeNode({ uid: fileUid, name: 'g.txt', type: 'file' as any })]);

        const { populator, ctx } = await indexTree('root');
        bridge.setIterateNodesError(fileUid, new Error('cannot load node'));

        // RepairFailedNodesTask re-throws anything that is not node-scoped, which would abandon the
        // remaining due entries. Tagging keeps the failure to this one entry.
        await expect(
            populator.repairNode(
                {
                    nodeUid: fileUid,
                    indexKind: IndexKind.MAIN,
                    indexPopulatorKind: 'test-populator',
                    treeEventScopeId: SCOPE_ID,
                    operation: 'index',
                    parentNodeUid: 'root',
                    attempts: 1,
                    firstFailedAt: 1,
                    lastAttemptAt: 1,
                    nextAttemptAt: 1,
                },
                ctx
            )
        ).rejects.toBeInstanceOf(RepairableNodeError);
    });
});

describe('NodeTreeIndexPopulator incremental blob cleanup', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        indexRegistry = new IndexRegistry(await generateAndImportKey());
        bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', type: NodeType.Folder }));
    });

    it('keeps the blob store bounded across a batch of incremental node_created events instead of accumulating an unreleased blob generation per event', async () => {
        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db, indexRegistry });

        const childUids = Array.from({ length: 20 }, (_, i) => `vol1~node${i}`);
        bridge.setChildren(
            'root',
            childUids.map((uid, i) => makeMaybeNode({ uid, name: `file-${i}.txt`, type: NodeType.File }))
        );

        const events = childUids.map((uid, i) => nodeCreated(uid, `e${i}`));
        const processed = await populator.processIncrementalUpdates(events, ctx);

        expect(processed).toBe(events.length);
        // Without cleanup interleaved after every event, this index accumulates ~6 new,
        // never-released blobs per commit - 20 events would leave over 120
        // blobs behind. With cleanup running after every event, it stays near the small
        // steady-state regardless of how many events were processed.
        const blobCount = await db.countIndexBlobs(IndexKind.MAIN);
        expect(blobCount).toBeLessThan(20);
    });
});
