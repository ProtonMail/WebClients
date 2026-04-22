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

    it('getGeneration returns existing generation from DB', async () => {
        await db.putPopulatorState({ uid: `myfiles:${SCOPE_ID}`, done: true, generation: 3, version: 1 });
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

    it('visitAndProduceIndexEntries yields only tree entries when trash is empty', async () => {
        const myFilesRootNideUid = 'root-uid';
        bridge.setMyFilesRootNode(
            makeMaybeNode({ uid: myFilesRootNideUid, name: 'My Files', type: 'folder' as NodeType })
        );
        bridge.setChildren(myFilesRootNideUid, [
            makeMaybeNode({ uid: 'file-live', name: 'live.pdf', type: 'file' as NodeType }),
        ]);
        // No setTrashedNodes → iterator returns nothing.

        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries.map((e) => e.documentId)).toEqual(['file-live']);
    });

    it('visitAndProduceIndexEntries yields trashed nodes even when the live tree is empty', async () => {
        const myFilesRootNideUid = 'root-uid';
        bridge.setMyFilesRootNode(
            makeMaybeNode({ uid: myFilesRootNideUid, name: 'My Files', type: 'folder' as NodeType })
        );
        bridge.setChildren(myFilesRootNideUid, []);
        bridge.setTrashedNodes([
            makeMaybeNode({
                uid: 'file-trashed',
                name: 'old.pdf',
                type: 'file' as NodeType,
                trashTime: new Date('2025-06-01'),
            }),
        ]);

        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries.map((e) => e.documentId)).toEqual(['file-trashed']);
    });

    it('aborts during trashed walk when the signal fires', async () => {
        const myFilesRootNideUid = 'root-uid';
        bridge.setMyFilesRootNode(
            makeMaybeNode({ uid: myFilesRootNideUid, name: 'My Files', type: 'folder' as NodeType })
        );
        bridge.setChildren(myFilesRootNideUid, []);
        bridge.setTrashedNodes([
            makeMaybeNode({
                uid: 'file-trashed',
                name: 'old.pdf',
                type: 'file' as NodeType,
                trashTime: new Date('2025-06-01'),
            }),
        ]);

        const ac = new AbortController();
        ac.abort();
        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db, signal: ac.signal });

        await expect(collectEntries(populator.visitAndProduceIndexEntries(ctx))).rejects.toThrow();
    });

    it('indexes trashed nodes with undecryptable names using fallback', async () => {
        const myFilesRootNideUid = 'root-uid';
        bridge.setMyFilesRootNode(
            makeMaybeNode({ uid: myFilesRootNideUid, name: 'My Files', type: 'folder' as NodeType })
        );
        bridge.setChildren(myFilesRootNideUid, []);

        const degradedTrashedNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'trashed-bad',
                name: { ok: false, error: new Error('decrypt failed') },
                type: 'file' as NodeType,
                creationTime: new Date(),
                modificationTime: new Date(),
                trashTime: new Date('2025-06-01'),
            },
        } as unknown as MaybeNode;
        bridge.setTrashedNodes([degradedTrashedNode]);

        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(1);
        expect(entries[0].documentId).toBe('trashed-bad');
    });

    it('stamps scope, generation, and populator id on trashed entries', async () => {
        await db.putPopulatorState({ uid: `myfiles:${SCOPE_ID}`, done: false, generation: 7, version: 2 });

        const myFilesRootNideUid = 'root-uid';
        bridge.setMyFilesRootNode(
            makeMaybeNode({ uid: myFilesRootNideUid, name: 'My Files', type: 'folder' as NodeType })
        );
        bridge.setChildren(myFilesRootNideUid, []);
        bridge.setTrashedNodes([
            makeMaybeNode({
                uid: 'file-trashed',
                name: 'old.pdf',
                type: 'file' as NodeType,
                trashTime: new Date('2025-06-01'),
            }),
        ]);

        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        const attr = (name: string) => entries[0].attributes.find((a) => a.name === name)?.value;
        expect(attr('treeEventScopeId')).toEqual({ kind: 'tag', value: SCOPE_ID });
        expect(attr('indexPopulatorId')).toEqual({ kind: 'tag', value: 'myfiles' });
        expect(attr('indexPopulatorGeneration')).toEqual({ kind: 'integer', value: 7n });
    });

    it('visitAndProduceIndexEntries yields trashed nodes after tree entries', async () => {
        const myFilesRootNideUid = 'root-uid';
        bridge.setMyFilesRootNode(
            makeMaybeNode({ uid: myFilesRootNideUid, name: 'My Files', type: 'folder' as NodeType })
        );
        bridge.setChildren(myFilesRootNideUid, [
            makeMaybeNode({ uid: 'file-live', name: 'live.pdf', type: 'file' as NodeType }),
        ]);
        bridge.setTrashedNodes([
            makeMaybeNode({
                uid: 'file-trashed-1',
                name: 'old.pdf',
                type: 'file' as NodeType,
                trashTime: new Date('2025-06-01'),
            }),
            makeMaybeNode({
                uid: 'folder-trashed',
                name: 'archive',
                type: 'folder' as NodeType,
                trashTime: new Date('2025-06-02'),
            }),
        ]);

        const populator = new MyFilesIndexPopulator(SCOPE_ID);
        const ctx = makeTaskContext({ bridge: bridge.asBridge(), db });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries.map((e) => e.documentId)).toEqual(['file-live', 'file-trashed-1', 'folder-trashed']);

        const trashedEntry = entries[1];
        const trashTimeAttr = trashedEntry.attributes.find((a) => a.name === 'trashTime');
        expect(trashTimeAttr?.value).toEqual({
            kind: 'integer',
            value: BigInt(new Date('2025-06-01').getTime()),
        });

        const pathAttr = trashedEntry.attributes.find((a) => a.name === 'path');
        expect(pathAttr?.value).toEqual({ kind: 'tag', value: '' });
    });
});
