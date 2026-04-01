import type { MaybeNode, NodeEntity } from '@protontech/drive-sdk';

import { createMockNodeEntity } from '../../../../../../utils/test/nodeEntity';
import type { TreeEventScopeId } from '../../../shared/types';
import { FakeMainThreadBridge } from '../../../testing/FakeMainThreadBridge';
import { makeTaskContext } from '../../../testing/makeTaskContext';
import { IndexKind } from '../../index/IndexRegistry';
import type { IndexEntry } from '../indexEntry';
import { NodeTreeIndexPopulator } from './NodeTreeIndexPopulator';

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Partial<NodeEntity> = {}): MaybeNode =>
    ({ ok: true, value: createMockNodeEntity(overrides) }) as unknown as MaybeNode;

class TestNodeTreePopulator extends NodeTreeIndexPopulator {
    constructor(
        private readonly rootUid: string,
        generation = 1
    ) {
        super(SCOPE_ID, IndexKind.MAIN, 'test-populator', 1, generation);
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

        // BFS order: root children first, then folder-a children, folder-b children, then deeper levels
        const ids = entries.map((e) => e.documentId);
        expect(ids).toEqual([
            'folder-a',
            'folder-b',
            'file-root1',
            'folder-empty',
            'file-a1',
            'folder-a-nested',
            'file-a2',
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

        const populator = new TestNodeTreePopulator('root', 5 /* generation */);
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        const attr = entries[0].attributes.find((a) => a.name === 'indexPopulatorGeneration');
        expect(attr?.value).toEqual({ kind: 'integer', value: BigInt(5) });
    });

    it('indexes nodes without indexable filenames using fallback name', async () => {
        const degradedNoName: MaybeNode = {
            ok: false,
            error: {
                uid: 'bad-node',
                name: { ok: false, error: new Error('decrypt failed') },
                type: 'file' as any,
                creationTime: new Date(),
                modificationTime: new Date(),
            },
        } as unknown as MaybeNode;

        bridge.setChildren('root', [
            makeMaybeNode({ uid: 'file-ok', name: 'ok.txt', type: 'file' as any }),
            degradedNoName,
        ]);

        const populator = new TestNodeTreePopulator('root');
        const ctx = makeTaskContext({ bridge: bridge.asBridge() });
        const entries = await collectEntries(populator.visitAndProduceIndexEntries(ctx));

        expect(entries).toHaveLength(2);
        expect(entries[0].documentId).toBe('file-ok');
        expect(entries[1].documentId).toBe('bad-node');
    });
});
