import type { MaybeNode, NodeEntity, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createMockNodeEntity } from '../../../../../../utils/test/nodeEntity';
import { SearchDB } from '../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../shared/types';
import { FakeMainThreadBridge } from '../../../testing/FakeMainThreadBridge';
import { makeTaskContext } from '../../../testing/makeTaskContext';
import type { IndexEntry } from '../indexEntry';
import { MyFilesIndexPopulator } from './MyFilesIndexPopulator';

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Partial<NodeEntity> = {}): MaybeNode =>
    ({ ok: true, value: createMockNodeEntity(overrides) }) as unknown as MaybeNode;

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

    it('create() initializes with generation from DB when state exists', async () => {
        await db.putPopulatorState({ uid: `myfiles:${SCOPE_ID}`, done: true, generation: 3 });
        const populator = await MyFilesIndexPopulator.create(SCOPE_ID, db);
        expect(populator.getGeneration()).toBe(3);
    });

    it('create() initializes with generation=1 when no state exists', async () => {
        const populator = await MyFilesIndexPopulator.create(SCOPE_ID, db);
        expect(populator.getGeneration()).toBe(1);
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

        const populator = await MyFilesIndexPopulator.create(SCOPE_ID, db);
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(2);
        expect(entries.map((e) => e.documentId)).toEqual(['file-1', 'file-2']);
    });
});
