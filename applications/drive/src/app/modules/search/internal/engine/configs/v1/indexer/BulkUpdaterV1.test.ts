import type { MaybeNode, NodeEntity } from '@proton/drive';
import { NodeType } from '@proton/drive';

import { createMockNodeEntity } from '../../../../../../../utils/test/nodeEntity';
import type { MainThreadBridge } from '../../../../MainThreadBridge';
import { BulkUpdaterV1 } from './BulkUpdaterV1';

jest.mock('../../../../Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function toMaybeNode(overrides: Partial<NodeEntity>): MaybeNode {
    return { ok: true, value: createMockNodeEntity(overrides) };
}

/**
 * Build a fake MainThreadBridge from a tree definition.
 *
 * `tree` maps a folder uid to its children (MaybeNode[]).
 * `root` is the MaybeNode returned by getMyFilesRootFolder.
 */
function createFakeBridge(root: MaybeNode, tree: Record<string, MaybeNode[]>): MainThreadBridge {
    return {
        driveSdk: {
            getMyFilesRootFolder: () => Promise.resolve(root),
            iterateFolderChildren: (parentNodeUid: string) => Promise.resolve(tree[parentNodeUid] ?? []),
        },
    } as MainThreadBridge;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function collectEntries(updater: BulkUpdaterV1, bridge: MainThreadBridge) {
    const entries = [];
    for await (const entry of updater.visitAndProduceIndexEntries(bridge)) {
        entries.push(entry);
    }
    return entries;
}

function getAttr(entry: { attributes: { name: string; value: { value: unknown } }[] }, name: string) {
    return entry.attributes.find((a) => a.name === name)?.value.value;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BulkUpdaterV1', () => {
    /*
     * Fake file structure:
     *
     * root/
     * ├── folderA/
     * │   ├── file1.txt
     * │   └── folderB/
     * │       └── file2.txt
     * ├── folderC/  (trashed)
     * │   └── file4.txt
     * ├── file3.txt
     * └── trashedFile.txt  (trashed)
     */
    const root = toMaybeNode({ uid: 'root', name: 'My Files', type: NodeType.Folder });

    const folderA = toMaybeNode({ uid: 'folderA', name: 'Folder A', type: NodeType.Folder, parentUid: 'root' });
    const folderB = toMaybeNode({ uid: 'folderB', name: 'Folder B', type: NodeType.Folder, parentUid: 'folderA' });

    const file1 = toMaybeNode({ uid: 'file1', name: 'file1.txt', type: NodeType.File, parentUid: 'folderA' });
    const file2 = toMaybeNode({
        uid: 'file2',
        name: 'file2.txt',
        type: NodeType.File,
        parentUid: 'folderB',
        creationTime: new Date('2024-03-10'),
        modificationTime: new Date('2024-09-20'),
        mediaType: 'image/png',
    });
    const file3 = toMaybeNode({ uid: 'file3', name: 'file3.txt', type: NodeType.File, parentUid: 'root' });

    const folderC = toMaybeNode({
        uid: 'folderC',
        name: 'Folder C',
        type: NodeType.Folder,
        parentUid: 'root',
        trashTime: new Date('2024-05-01'),
    });
    const file4 = toMaybeNode({ uid: 'file4', name: 'file4.txt', type: NodeType.File, parentUid: 'folderC' });

    const trashedFile = toMaybeNode({
        uid: 'trashed',
        name: 'trashedFile.txt',
        type: NodeType.File,
        parentUid: 'root',
        trashTime: new Date('2024-05-01'),
    });

    const tree: Record<string, MaybeNode[]> = {
        root: [folderA, folderC, file3, trashedFile],
        folderA: [file1, folderB],
        folderB: [file2],
        folderC: [file4],
    };

    let updater: BulkUpdaterV1;
    let bridge: MainThreadBridge;

    beforeEach(() => {
        updater = new BulkUpdaterV1();
        bridge = createFakeBridge(root, tree);
    });

    it('should recursively index all non-trashed nodes', async () => {
        const entries = await collectEntries(updater, bridge);
        const ids = entries.map((e) => e.documentId);

        expect(ids).toEqual(['folderA', 'file3', 'file1', 'folderB', 'file2']);
    });

    it('should exclude trashed nodes', async () => {
        const entries = await collectEntries(updater, bridge);
        const ids = entries.map((e) => e.documentId);

        expect(ids).not.toContain('trashed');
    });

    it('should set correct parent path for each node', async () => {
        const entries = await collectEntries(updater, bridge);
        const paths = Object.fromEntries(entries.map((e) => [e.documentId, getAttr(e, 'path')]));

        expect(paths).toEqual({
            folderA: '',
            file1: '/folderA',
            folderB: '/folderA',
            file2: '/folderA/folderB',
            file3: '',
        });
    });

    it('should include filename attribute', async () => {
        const entries = await collectEntries(updater, bridge);
        const names = Object.fromEntries(entries.map((e) => [e.documentId, getAttr(e, 'filename')]));

        expect(names).toEqual({
            folderA: 'Folder A',
            file1: 'file1.txt',
            folderB: 'Folder B',
            file2: 'file2.txt',
            file3: 'file3.txt',
        });
    });

    it('should include creationTime and modificationTime as bigint epoch ms', async () => {
        const entries = await collectEntries(updater, bridge);
        const file2Entry = entries.find((e) => e.documentId === 'file2');
        if (!file2Entry) {
            throw new Error('Bad test setup: file2 entry not found');
        }

        expect(getAttr(file2Entry, 'creationTime')).toBe(BigInt(new Date('2024-03-10').getTime()));
        expect(getAttr(file2Entry, 'modificationTime')).toBe(BigInt(new Date('2024-09-20').getTime()));
    });

    it('should include nodeType attribute as tag', async () => {
        const entries = await collectEntries(updater, bridge);
        const types = Object.fromEntries(entries.map((e) => [e.documentId, getAttr(e, 'nodeType')]));

        expect(types).toEqual({
            folderA: NodeType.Folder,
            file1: NodeType.File,
            folderB: NodeType.Folder,
            file2: NodeType.File,
            file3: NodeType.File,
        });
    });

    it('should include mediaType attribute', async () => {
        const entries = await collectEntries(updater, bridge);
        const mediaTypes = Object.fromEntries(entries.map((e) => [e.documentId, getAttr(e, 'mediaType')]));

        expect(mediaTypes.file2).toBe('image/png');
        expect(mediaTypes.file1).toBe('application/octet-stream');
    });

    it('should yield nothing for an empty root folder', async () => {
        const emptyBridge = createFakeBridge(root, { root: [] });
        const entries = await collectEntries(updater, emptyBridge);

        expect(entries).toEqual([]);
    });

    it('should not recurse into trashed folders', async () => {
        const entries = await collectEntries(updater, bridge);
        const ids = entries.map((e) => e.documentId);

        expect(ids).not.toContain('folderC');
        expect(ids).not.toContain('file4');
    });
});
