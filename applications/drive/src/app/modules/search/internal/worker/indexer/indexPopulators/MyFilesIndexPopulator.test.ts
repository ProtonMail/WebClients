import type { NodeEntity, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createMockNodeEntity } from '@proton/drive/modules/testing';

import type { IndexPopulatorState } from '../../../shared/SearchDB';
import { SearchDB } from '../../../shared/SearchDB';
import { IndexKind } from '../../../shared/types';
import type { TreeEventScopeId } from '../../../shared/types';
import { FakeMainThreadBridge } from '../../../testing/FakeMainThreadBridge';
import { makeTaskContext } from '../../../testing/makeTaskContext';
import type { IndexEntry } from '../indexEntry';
import type { BFSVisitorState } from '../utils/resumableTreeVisitor/ResumableFolderBFSVisitor';
import { MyFilesIndexPopulator } from './MyFilesIndexPopulator';
import { NodeTreeIndexPopulator } from './NodeTreeIndexPopulator';

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Omit<Partial<NodeEntity>, 'name'> & { name?: string } = {}): NodeEntity => {
    const { name, ...rest } = overrides;
    return createMockNodeEntity({
        ...rest,
        ...(name !== undefined ? { name: { ok: true, value: name } } : {}),
    });
};

async function collectEntries(gen: AsyncIterableIterator<IndexEntry>): Promise<IndexEntry[]> {
    const entries: IndexEntry[] = [];
    for await (const entry of gen) {
        entries.push(entry);
    }
    return entries;
}

describe('MyFilesIndexPopulator', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
    });

    it('getGeneration returns existing generation from DB', async () => {
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
        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        expect(await populator.getGeneration(db)).toBe(3);
    });

    it('getGeneration returns 1 when no state exists (lazy init)', async () => {
        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        expect(await populator.getGeneration(db)).toBe(1);
    });

    it('visitAndProduceIndexEntries yields entries from the tree', async () => {
        const myFilesRootNideUid = 'root-uid';
        const rootNode = makeMaybeNode({
            uid: myFilesRootNideUid,
            name: 'My Files',
            type: 'folder' as NodeType,
            treeEventScopeId: SCOPE_ID,
        });
        bridge.setMyFilesRootNode(rootNode);
        bridge.setChildren(myFilesRootNideUid, [
            makeMaybeNode({ uid: 'file-1', name: 'report.pdf', type: 'file' as NodeType }),
            makeMaybeNode({ uid: 'file-2', name: 'notes.txt', type: 'file' as NodeType }),
        ]);

        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(2);
        expect(entries.map((e) => e.documentId)).toEqual(['file-1', 'file-2']);
    });

    describe('resumable indexing', () => {
        const populatorUid = `myfiles:${SCOPE_ID}`;
        const initialVisitorId = NodeTreeIndexPopulator.initialVisitorId(populatorUid);

        const baseState: IndexPopulatorState = {
            uid: populatorUid,
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'myfiles',
            treeEventScopeId: SCOPE_ID,
            done: false,
            generation: 1,
            version: 1,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        };

        const putVisitorState = (partial: Partial<BFSVisitorState> = {}) =>
            db.putBFSVisitorState({
                id: initialVisitorId,
                queue: [],
                generation: 1,
                updatedAt: Date.now(),
                ...partial,
            });

        it('markAsDone deletes the BFS visitor state', async () => {
            await db.putPopulatorState(baseState);
            await putVisitorState({ queue: [{ folderUid: 'x', parentPath: '' }] });

            const populator = new MyFilesIndexPopulator(SCOPE_ID);
            await populator.markAsDone(db);

            const state = await db.getPopulatorState(populatorUid);
            expect(state?.done).toBe(true);
            expect(await db.getBFSVisitorState(initialVisitorId)).toBeUndefined();
        });

        // Regression guard. markAsNotDone re-fires on EVERY retry while the persisted `version` is
        // stale (it never writes `version`), so if it ever reset initialIndexingFailed the bit would
        // be cleared before each failure and every one would report as the first attempt. It is safe
        // today only because markAsNotDone spreads `...state` and leaves the field alone.
        it('markAsNotDone preserves the sticky initialIndexingFailed flag', async () => {
            await db.putPopulatorState({ ...baseState, initialIndexingFailed: true });

            const populator = new MyFilesIndexPopulator(SCOPE_ID);
            await populator.markAsNotDone(db);

            expect((await db.getPopulatorState(populatorUid))?.initialIndexingFailed).toBe(true);
        });

        it('markAsNotDone deletes the BFS visitor state and bumps the generation', async () => {
            await db.putPopulatorState({ ...baseState, generation: 4 });
            await putVisitorState({ generation: 4, queue: [] });

            const populator = new MyFilesIndexPopulator(SCOPE_ID);
            await populator.markAsNotDone(db);

            const state = await db.getPopulatorState(populatorUid);
            expect(state?.done).toBe(false);
            expect(state?.generation).toBe(5);
            expect(await db.getBFSVisitorState(initialVisitorId)).toBeUndefined();
        });

        it('resumes the folder walk from the persisted BFS visitor state, not from the root', async () => {
            await db.putPopulatorState(baseState);
            await putVisitorState({ queue: [{ folderUid: 'folder-b', parentPath: '/folder-b' }] });

            // Root children must NOT be walked on resume.
            bridge.setMyFilesRootNode(makeMaybeNode({ uid: 'root-uid', name: 'My Files', type: 'folder' as NodeType }));
            bridge.setChildren('root-uid', [
                makeMaybeNode({ uid: 'root-file', name: 'root.pdf', type: 'file' as NodeType }),
            ]);
            bridge.setChildren('folder-b', [makeMaybeNode({ uid: 'b-file', name: 'b.pdf', type: 'file' as NodeType })]);

            const populator = new MyFilesIndexPopulator(SCOPE_ID);
            const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
            const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

            expect(entries.map((e) => e.documentId)).toEqual(['b-file']);
        });

        it('resumes mid-folder from a currentFolder checkpoint, skipping already-indexed UIDs', async () => {
            // uid-a was already indexed before the crash - not in pendingUids.
            // Only uid-b and uid-c should be yielded on resume.
            await db.putPopulatorState(baseState);
            await putVisitorState({
                queue: [],
                currentFolder: { folderUid: 'folder-x', parentPath: '/folder-x', pendingUids: ['uid-b', 'uid-c'] },
            });

            bridge.setMyFilesRootNode(makeMaybeNode({ uid: 'root-uid', name: 'My Files', type: 'folder' as NodeType }));
            bridge.setNode('uid-b', makeMaybeNode({ uid: 'uid-b', name: 'b.txt', type: 'file' as NodeType }));
            bridge.setNode('uid-c', makeMaybeNode({ uid: 'uid-c', name: 'c.txt', type: 'file' as NodeType }));

            const populator = new MyFilesIndexPopulator(SCOPE_ID);
            const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
            const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

            expect(entries.map((e) => e.documentId).sort()).toEqual(['uid-b', 'uid-c']);
        });
    });
});
