import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { DriveEvent, NodeEntity, NodeEvent, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createMockNodeEntity } from '@proton/drive/modules/testing';

import type { RepairNodeEntry } from '../../../shared/SearchDB';
import { SearchDB } from '../../../shared/SearchDB';
import { RepairableNodeError, SearchLibraryError } from '../../../shared/errors';
import type { TreeEventScopeId } from '../../../shared/types';
import { FakeMainThreadBridge } from '../../../testing/FakeMainThreadBridge';
import { findDocuments, findDocumentsByTag } from '../../../testing/indexHelpers';
import { makeTaskContext } from '../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../index/IndexRegistry';
import { TreeSubscriptionRegistry } from '../TreeSubscriptionRegistry';
import { normalizedFilenameForTag } from '../indexEntry';
import type { TaskContext } from '../tasks/BaseTask';
import { CleanUpStaleIndexEntryTask } from '../tasks/CleanUpTasks/CleanUpStaleIndexEntryTask';
import { IndexPopulatorTask } from '../tasks/CoreTasks/IndexPopulatorTask';
import { NodeTreeIndexPopulator } from './NodeTreeIndexPopulator';

setupRealSearchLibraryWasm();

jest.mock('../../../shared/errors', () => {
    const actual = jest.requireActual('../../../shared/errors');
    return { ...actual, sendErrorReportForSearch: jest.fn() };
});

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Omit<Partial<NodeEntity>, 'name'> & { name?: string } = {}): NodeEntity => {
    const { name, ...rest } = overrides;
    return createMockNodeEntity({
        ...rest,
        ...(name !== undefined ? { name: { ok: true, value: name } } : {}),
    });
};

const makeUndecryptableNode = (overrides: Omit<Partial<NodeEntity>, 'name'> = {}): NodeEntity =>
    createMockNodeEntity({
        ...overrides,
        name: { ok: false, error: new Error('decryption failed') },
    });

const makeNodeEvent = (
    type: 'node_created' | 'node_updated' | 'node_deleted',
    nodeUid: string,
    extra: Partial<NodeEvent> = {}
): NodeEvent =>
    ({
        type,
        nodeUid,
        eventId: `evt-${nodeUid}`,
        treeEventScopeId: SCOPE_ID,
        isTrashed: false,
        isShared: false,
        ...extra,
    }) as unknown as NodeEvent;

const makeDriveEvent = (type: string, eventId: string, extra: Record<string, unknown> = {}): DriveEvent =>
    ({ type, eventId, treeEventScopeId: SCOPE_ID, ...extra }) as unknown as DriveEvent;

/**
 * Concrete node-tree populator. The node/tree incremental logic under test lives on
 * NodeTreeIndexPopulator; the base IndexPopulator is agnostic of nodes/trees/traversal.
 */
class TestPopulator extends NodeTreeIndexPopulator {
    constructor() {
        super(SCOPE_ID, IndexKind.MAIN, 'test-pop', 1);
    }

    protected async getRootNodeUid(): Promise<string> {
        return 'root';
    }
}

describe('IndexPopulator', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
    });

    const buildCtx = async (): Promise<TaskContext> => {
        const treeSubscriptionRegistry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
        return makeTaskContext({
            bridge: bridge.asBridge(),
            db,
            indexRegistry,
            treeSubscriptionRegistry,
        });
    };

    const expectIndexed = async (nodeUid: string, expectedCount = 1) => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const results = await findDocumentsByTag(instance.indexReader, 'nodeUid', nodeUid);
        expect(results).toHaveLength(expectedCount);
        return results;
    };

    // =========================================================================
    // handleNodeCreated
    // =========================================================================
    describe('handleNodeCreated (via processNodeMutation)', () => {
        it('indexes a new node into the search engine', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'parent-folder',
                makeMaybeNode({ uid: 'parent-folder', name: 'ParentFolder', parentUid: 'root' })
            );
            bridge.setNode(
                'new-file',
                makeMaybeNode({
                    uid: 'new-file',
                    name: 'hello.txt',
                    type: 'file' as NodeType,
                    parentUid: 'parent-folder',
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'new-file', { parentNodeUid: 'parent-folder' });
            await populator.processNodeMutation(event, ctx);

            const results = await expectIndexed('new-file');
            expect(results[0].identifier).toBe('new-file');
        });

        it('indexes a node at root level with empty parentPath', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'root-child',
                makeMaybeNode({ uid: 'root-child', name: 'readme.md', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'root-child', { parentNodeUid: 'root' });
            await populator.processNodeMutation(event, ctx);

            await expectIndexed('root-child');
        });

        it('indexes a node with no parentNodeUid using empty parentPath', async () => {
            bridge.setNode('orphan', makeMaybeNode({ uid: 'orphan', name: 'orphan.txt', type: 'file' as NodeType }));

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'orphan', { parentNodeUid: undefined });
            await populator.processNodeMutation(event, ctx);

            await expectIndexed('orphan');
        });

        it('indexes trashed nodes so they remain searchable (e.g. in a trash-only view)', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'trashed-node',
                makeMaybeNode({
                    uid: 'trashed-node',
                    name: 'gone.txt',
                    type: 'file' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'trashed-node', {
                parentNodeUid: 'root',
                isTrashed: true,
            });
            await populator.processNodeMutation(event, ctx);

            await expectIndexed('trashed-node');
        });

        it('resolves without indexing when the node is already gone', async () => {
            // Don't register the node. The API cannot distinguish deleted from inaccessible, so a
            // node that vanished before its event was processed is dropped rather than quarantined.
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'missing-node');
            await expect(populator.processNodeMutation(event, ctx)).resolves.toBeUndefined();
        });

        it('throws when the node cannot be fetched', async () => {
            bridge.setIterateNodesError('broken-node', new Error('failed to load node'));

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            // A failed fetch is scoped to this node, so it is quarantinable rather than systemic.
            const event = makeNodeEvent('node_created', 'broken-node');
            await expect(populator.processNodeMutation(event, ctx)).rejects.toBeInstanceOf(RepairableNodeError);
        });

        it('throws when resolveParentPath fails', async () => {
            // Register the node but not its parent — resolveParentPathFromSdk will fail
            bridge.setNode(
                'child',
                makeMaybeNode({
                    uid: 'child',
                    name: 'child.txt',
                    type: 'file' as NodeType,
                    parentUid: 'missing-parent',
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'child', { parentNodeUid: 'missing-parent' });
            await expect(populator.processNodeMutation(event, ctx)).rejects.toThrow();
        });
    });

    // =========================================================================
    // handleNodeDeleted
    // =========================================================================
    describe('handleNodeDeleted (via processNodeMutation)', () => {
        const indexNode = async (
            populator: TestPopulator,
            ctx: TaskContext,
            nodeUid: string,
            parentNodeUid?: string
        ) => {
            const event = makeNodeEvent('node_created', nodeUid, { parentNodeUid });
            await populator.processNodeMutation(event, ctx);
        };

        it('removes a single node from the index', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'file-1',
                makeMaybeNode({ uid: 'file-1', name: 'hello.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'file-1', 'root');
            await expectIndexed('file-1');

            await populator.processNodeMutation(makeNodeEvent('node_deleted', 'file-1'), ctx);

            await expectIndexed('file-1', 0);
        });

        it('removes a node and all its descendants', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'FolderA', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-1',
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );
            bridge.setNode(
                'child-2',
                makeMaybeNode({ uid: 'child-2', name: 'c2.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            // Index parent folder and its children
            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-1', 'folder-a');
            await indexNode(populator, ctx, 'child-2', 'folder-a');

            await expectIndexed('folder-a');
            await expectIndexed('child-1');
            await expectIndexed('child-2');

            // Delete the parent folder
            await populator.processNodeMutation(makeNodeEvent('node_deleted', 'folder-a'), ctx);

            await expectIndexed('folder-a', 0);
            await expectIndexed('child-1', 0);
            await expectIndexed('child-2', 0);
        });

        it('removes deeply nested descendants', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'folder-b',
                makeMaybeNode({ uid: 'folder-b', name: 'B', type: 'folder' as NodeType, parentUid: 'folder-a' })
            );
            bridge.setNode(
                'deep-file',
                makeMaybeNode({ uid: 'deep-file', name: 'deep.txt', type: 'file' as NodeType, parentUid: 'folder-b' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'folder-b', 'folder-a');
            await indexNode(populator, ctx, 'deep-file', 'folder-b');

            // Delete top-level folder — should cascade to folder-b and deep-file
            await populator.processNodeMutation(makeNodeEvent('node_deleted', 'folder-a'), ctx);

            await expectIndexed('folder-a', 0);
            await expectIndexed('folder-b', 0);
            await expectIndexed('deep-file', 0);
        });

        it('does not remove sibling nodes', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'file-a',
                makeMaybeNode({ uid: 'file-a', name: 'a.txt', type: 'file' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'file-b',
                makeMaybeNode({ uid: 'file-b', name: 'b.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'file-a', 'root');
            await indexNode(populator, ctx, 'file-b', 'root');

            await populator.processNodeMutation(makeNodeEvent('node_deleted', 'file-a'), ctx);

            await expectIndexed('file-a', 0);
            await expectIndexed('file-b', 1);
        });

        it('succeeds when node is not in the index', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await populator.processNodeMutation(makeNodeEvent('node_deleted', 'nonexistent'), ctx);
        });
    });

    // =========================================================================
    // handleNodeUpdated
    // =========================================================================
    describe('handleNodeUpdated (via processNodeMutation)', () => {
        const indexNode = async (
            populator: TestPopulator,
            ctx: TaskContext,
            nodeUid: string,
            parentNodeUid?: string
        ) => {
            const event = makeNodeEvent('node_created', nodeUid, { parentNodeUid });
            await populator.processNodeMutation(event, ctx);
        };

        it('updates a node metadata in the index', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'file-1',
                makeMaybeNode({ uid: 'file-1', name: 'old-name.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'file-1', 'root');
            await expectIndexed('file-1');

            // Update the node name in the bridge
            bridge.setNode(
                'file-1',
                makeMaybeNode({ uid: 'file-1', name: 'new-name.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'file-1', { parentNodeUid: 'root' }),
                ctx
            );

            // Still exactly one entry
            await expectIndexed('file-1');
        });

        it('keeps a trashed folder in the index but removes its nested descendants', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'nested-folder',
                makeMaybeNode({
                    uid: 'nested-folder',
                    name: 'Nested',
                    type: 'folder' as NodeType,
                    parentUid: 'folder-a',
                })
            );
            bridge.setNode(
                'deep-file',
                makeMaybeNode({
                    uid: 'deep-file',
                    name: 'deep.txt',
                    type: 'file' as NodeType,
                    parentUid: 'nested-folder',
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'nested-folder', 'folder-a');
            await indexNode(populator, ctx, 'deep-file', 'nested-folder');
            await expectIndexed('folder-a');
            await expectIndexed('nested-folder');
            await expectIndexed('deep-file');

            // SDK now reports the top-level folder as trashed.
            bridge.setNode(
                'folder-a',
                makeMaybeNode({
                    uid: 'folder-a',
                    name: 'A',
                    type: 'folder' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );
            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root', isTrashed: true }),
                ctx
            );

            await expectIndexed('folder-a');
            await expectIndexed('nested-folder', 0);
            await expectIndexed('deep-file', 0);
        });

        it('removes descendants but keeps the folder when a folder is trashed', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-1',
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-1', 'folder-a');
            await expectIndexed('folder-a');
            await expectIndexed('child-1');

            // SDK now reports the folder as trashed.
            bridge.setNode(
                'folder-a',
                makeMaybeNode({
                    uid: 'folder-a',
                    name: 'A',
                    type: 'folder' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );
            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root', isTrashed: true }),
                ctx
            );

            await expectIndexed('folder-a');
            await expectIndexed('child-1', 0);
        });

        it('does not walk the subtree when a folder is trashed', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({
                    uid: 'folder-a',
                    name: 'A',
                    type: 'folder' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );
            // SDK is primed with children — if we mistakenly walked the trashed folder's
            // subtree we would pick them up. We must not.
            bridge.setChildren('folder-a', [
                makeMaybeNode({
                    uid: 'surprise-child',
                    name: 'surprise.txt',
                    type: 'file' as NodeType,
                    parentUid: 'folder-a',
                }),
            ]);

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root', isTrashed: true }),
                ctx
            );

            await expectIndexed('folder-a');
            await expectIndexed('surprise-child', 0);
        });

        it('is idempotent for repeated trashed updates', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({
                    uid: 'folder-a',
                    name: 'A',
                    type: 'folder' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const trashedEvent = makeNodeEvent('node_updated', 'folder-a', {
                parentNodeUid: 'root',
                isTrashed: true,
            });
            await populator.processNodeMutation(trashedEvent, ctx);
            await populator.processNodeMutation(trashedEvent, ctx);

            await expectIndexed('folder-a');
        });

        it('reflects rename of an already-trashed node', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'file-1',
                makeMaybeNode({
                    uid: 'file-1',
                    name: 'original.txt',
                    type: 'file' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'file-1', { parentNodeUid: 'root', isTrashed: true }),
                ctx
            );

            // Rename in trash.
            bridge.setNode(
                'file-1',
                makeMaybeNode({
                    uid: 'file-1',
                    name: 'renamed.txt',
                    type: 'file' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );
            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'file-1', { parentNodeUid: 'root', isTrashed: true }),
                ctx
            );

            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            const results = await findDocumentsByTag(
                instance.indexReader,
                'filenameTag',
                normalizedFilenameForTag('renamed.txt')
            );
            expect(results.map((r) => r.identifier)).toEqual(['file-1']);
        });

        it('on a folder move: upserts the anchor and re-indexes the subtree inline (adds new children), clearing the marker on completion', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'folder-b',
                makeMaybeNode({ uid: 'folder-b', name: 'B', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-1',
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            // Index folder-a at root with child-1 inside
            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-1', 'folder-a');
            await indexNode(populator, ctx, 'folder-b', 'root');

            // Move folder-a under folder-b; the SDK reports the (moved) subtree incl. a new child.
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'folder-b' })
            );
            bridge.setChildren('folder-a', [
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
                makeMaybeNode({ uid: 'child-2', name: 'c2.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
            ]);

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'folder-b' }),
                ctx
            );

            // Anchor upserted; subtree re-indexed inline (existing kept, new added).
            await expectIndexed('folder-a');
            await expectIndexed('child-1');
            await expectIndexed('child-2');
            // Marker cleared on completion.
            expect(
                await db.getBFSVisitorState(
                    NodeTreeIndexPopulator.subtreeVisitorId(IndexKind.MAIN, SCOPE_ID, 'folder-a')
                )
            ).toBeUndefined();
        });

        it('allocates a fresh epoch per completed re-index run', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root' });
            await populator.processNodeMutation(event, ctx);
            await populator.processNodeMutation(event, ctx);

            // Each run completes and clears its marker, so the next run takes the next epoch.
            const state = await db.getPopulatorState(populator.getUid());
            expect(state?.subtreeReindexEpoch).toBe(2);
        });

        it('does not affect sibling nodes', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'file-a',
                makeMaybeNode({ uid: 'file-a', name: 'a.txt', type: 'file' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'file-b',
                makeMaybeNode({ uid: 'file-b', name: 'b.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'file-a', 'root');
            await indexNode(populator, ctx, 'file-b', 'root');

            bridge.setNode(
                'file-a',
                makeMaybeNode({ uid: 'file-a', name: 'renamed.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'file-a', { parentNodeUid: 'root' }),
                ctx
            );

            await expectIndexed('file-a');
            await expectIndexed('file-b');
        });

        it('on un-trash: restores the folder subtree inline', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-1',
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            // Index, then trash — folder stays, descendants are wiped.
            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-1', 'folder-a');
            bridge.setNode(
                'folder-a',
                makeMaybeNode({
                    uid: 'folder-a',
                    name: 'A',
                    type: 'folder' as NodeType,
                    parentUid: 'root',
                    trashTime: new Date('2025-06-01'),
                })
            );
            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root', isTrashed: true }),
                ctx
            );
            await expectIndexed('folder-a');
            await expectIndexed('child-1', 0);

            // Un-trash: node_updated with isTrashed=false, children available via SDK
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setChildren('folder-a', [
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
            ]);

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root', isTrashed: false }),
                ctx
            );

            // Anchor + subtree restored inline.
            await expectIndexed('folder-a');
            await expectIndexed('child-1');
            expect(
                await db.getBFSVisitorState(
                    NodeTreeIndexPopulator.subtreeVisitorId(IndexKind.MAIN, SCOPE_ID, 'folder-a')
                )
            ).toBeUndefined();
        });

        it('indexes a node not previously in the index (upsert)', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'new-file',
                makeMaybeNode({ uid: 'new-file', name: 'new.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'new-file', { parentNodeUid: 'root' }),
                ctx
            );

            await expectIndexed('new-file');
        });
    });

    // =========================================================================
    // handleNodeUpdated — inline resumable subtree re-index (structural folder)
    // =========================================================================
    describe('handleNodeUpdated inline subtree re-index', () => {
        const indexNode = async (
            populator: TestPopulator,
            ctx: TaskContext,
            nodeUid: string,
            parentNodeUid?: string
        ) => {
            await populator.processNodeMutation(makeNodeEvent('node_created', nodeUid, { parentNodeUid }), ctx);
        };

        const reindexFolder = async (
            populator: TestPopulator,
            ctx: TaskContext,
            nodeUid: string,
            parentNodeUid: string
        ) => {
            await populator.processNodeMutation(makeNodeEvent('node_updated', nodeUid, { parentNodeUid }), ctx);
        };

        it('skips trashed children while re-indexing', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            bridge.setChildren('folder-a', [
                makeMaybeNode({ uid: 'child-ok', name: 'ok.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
                makeMaybeNode({
                    uid: 'child-trashed',
                    name: 'trashed.txt',
                    type: 'file' as NodeType,
                    parentUid: 'folder-a',
                    trashTime: new Date('2024-06-01'),
                }),
            ]);

            await reindexFolder(populator, ctx, 'folder-a', 'root');

            await expectIndexed('child-ok');
            await expectIndexed('child-trashed', 0);
        });

        it('indexes undecryptable children with a fallback name', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            bridge.setChildren('folder-a', [makeUndecryptableNode({ uid: 'bad-child', parentUid: 'folder-a' })]);

            await reindexFolder(populator, ctx, 'folder-a', 'root');

            await expectIndexed('bad-child');
        });

        it('re-indexes nested subfolders', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            bridge.setChildren('folder-a', [
                makeMaybeNode({ uid: 'sub-folder', name: 'Sub', type: 'folder' as NodeType, parentUid: 'folder-a' }),
            ]);
            bridge.setChildren('sub-folder', [
                makeMaybeNode({
                    uid: 'deep-file',
                    name: 'deep.txt',
                    type: 'file' as NodeType,
                    parentUid: 'sub-folder',
                }),
            ]);

            await reindexFolder(populator, ctx, 'folder-a', 'root');

            await expectIndexed('sub-folder');
            await expectIndexed('deep-file');
        });

        it('sweeps obsolete descendants no longer reported by the SDK', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-stays',
                makeMaybeNode({
                    uid: 'child-stays',
                    name: 'stays.txt',
                    type: 'file' as NodeType,
                    parentUid: 'folder-a',
                })
            );
            bridge.setNode(
                'child-gone',
                makeMaybeNode({ uid: 'child-gone', name: 'gone.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-stays', 'folder-a');
            await indexNode(populator, ctx, 'child-gone', 'folder-a');
            await expectIndexed('child-stays');
            await expectIndexed('child-gone');

            // Content change: child-gone removed, child-new added. Only the folder event fires.
            bridge.setChildren('folder-a', [
                makeMaybeNode({
                    uid: 'child-stays',
                    name: 'stays.txt',
                    type: 'file' as NodeType,
                    parentUid: 'folder-a',
                }),
                makeMaybeNode({ uid: 'child-new', name: 'new.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
            ]);

            await reindexFolder(populator, ctx, 'folder-a', 'root');

            await expectIndexed('child-stays'); // re-walked, re-stamped
            await expectIndexed('child-new'); // added
            await expectIndexed('child-gone', 0); // swept: not re-walked, still at old epoch
        });

        it('resumes from a persisted checkpoint using the pinned epoch (does not re-allocate)', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'phantom',
                makeMaybeNode({ uid: 'phantom', name: 'phantom.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );
            bridge.setChildren('folder-a', [
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
            ]);

            const populator = new TestPopulator();
            const ctx = await buildCtx();
            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'phantom', 'folder-a'); // seeded at epoch 0

            // Seed a mid-walk marker (as if a prior run had checkpointed) with a pinned epoch of 5.
            const visitorId = NodeTreeIndexPopulator.subtreeVisitorId(IndexKind.MAIN, SCOPE_ID, 'folder-a');
            await db.putBFSVisitorState({
                id: visitorId,
                queue: [{ folderUid: 'folder-a', parentPath: '/folder-a' }],
                generation: 1,
                updatedAt: 0,
                nodeUid: 'folder-a',
                parentPath: '/folder-a',
                epoch: 5,
            });

            await reindexFolder(populator, ctx, 'folder-a', 'root');

            // Walked child stamped with the pinned epoch (5); phantom (epoch 0) swept.
            await expectIndexed('child-1');
            await expectIndexed('phantom', 0);
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            expect(await findDocuments(instance.indexReader, { nodeUid: 'child-1', reindexEpoch: 5n })).toHaveLength(1);

            // Marker cleared; the epoch counter was never bumped (resume reused the pinned epoch).
            expect(await db.getBFSVisitorState(visitorId)).toBeUndefined();
            const state = await db.getPopulatorState(populator.getUid());
            expect(state?.subtreeReindexEpoch ?? 0).toBe(0);
        });

        it('discards a subtree marker left by a previous generation instead of resuming it', async () => {
            // Scenario: a subtree re-index crashed mid-walk (leaving its marker), then a tree_refresh
            // bumped the populator generation and re-populated the whole tree at epoch 0. The stale
            // marker survived markAsNotDone. Resuming it would replay the frozen checkpoint and reuse
            // the pinned epoch 5, so the sweep would delete the freshly-populated child (epoch 0 < 5).
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-fresh',
                makeMaybeNode({
                    uid: 'child-fresh',
                    name: 'fresh.txt',
                    type: 'file' as NodeType,
                    parentUid: 'folder-a',
                })
            );
            bridge.setChildren('folder-a', [
                makeMaybeNode({
                    uid: 'child-fresh',
                    name: 'fresh.txt',
                    type: 'file' as NodeType,
                    parentUid: 'folder-a',
                }),
            ]);

            const populator = new TestPopulator();
            const ctx = await buildCtx();
            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-fresh', 'folder-a'); // freshly populated at epoch 0

            // A tree_refresh bumped the populator to generation 2.
            await populator.markAsNotDone(db);

            // Stale marker frozen at the previous generation (1), a high pinned epoch (5), and an
            // empty frontier (as if the prior walk finished all folders but crashed before finalize).
            const visitorId = NodeTreeIndexPopulator.subtreeVisitorId(IndexKind.MAIN, SCOPE_ID, 'folder-a');
            await db.putBFSVisitorState({
                id: visitorId,
                queue: [],
                generation: 1,
                updatedAt: 0,
                nodeUid: 'folder-a',
                parentPath: '/folder-a',
                epoch: 5,
            });

            await reindexFolder(populator, ctx, 'folder-a', 'root');

            // The stale marker was discarded: the subtree was fully re-walked at a freshly allocated
            // epoch, so the freshly-populated child survives instead of being swept at pinned epoch 5.
            await expectIndexed('child-fresh');
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            expect(
                await findDocuments(instance.indexReader, { nodeUid: 'child-fresh', reindexEpoch: 1n })
            ).toHaveLength(1);

            // Marker cleared and a fresh epoch was allocated (proving the stale pinned epoch was not reused).
            expect(await db.getBFSVisitorState(visitorId)).toBeUndefined();
            const state = await db.getPopulatorState(populator.getUid());
            expect(state?.subtreeReindexEpoch).toBe(1);
        });
    });

    // =========================================================================
    // resolveParentPath (via handleNodeCreated)
    // =========================================================================
    describe('resolveParentPath', () => {
        it('resolves multi-level path from SDK', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode('folder-a', makeMaybeNode({ uid: 'folder-a', name: 'FolderA', parentUid: 'root' }));
            bridge.setNode('folder-b', makeMaybeNode({ uid: 'folder-b', name: 'FolderB', parentUid: 'folder-a' }));
            bridge.setNode(
                'deep-file',
                makeMaybeNode({ uid: 'deep-file', name: 'deep.txt', type: 'file' as NodeType, parentUid: 'folder-b' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'deep-file', { parentNodeUid: 'folder-b' });
            await populator.processNodeMutation(event, ctx);

            await expectIndexed('deep-file');
        });
    });

    // =========================================================================
    // processIncrementalUpdates
    // =========================================================================
    describe('processIncrementalUpdates', () => {
        it('processes all node events and returns total count', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'n1',
                makeMaybeNode({ uid: 'n1', name: 'a.txt', type: 'file' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'n2',
                makeMaybeNode({ uid: 'n2', name: 'b.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }),
                makeNodeEvent('node_created', 'n2', { parentNodeUid: 'root' }),
            ];

            const result = await populator.processIncrementalUpdates(events, ctx);

            expect(result).toBe(2);
        });

        it('throws on the first systemic node mutation failure', async () => {
            // n1 succeeds, n2 fails systemically. A permanent engine error is never one node's
            // fault, so it must stop the batch rather than quarantine n2 and carry on to n3.
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            for (const uid of ['n1', 'n2', 'n3']) {
                bridge.setNode(
                    uid,
                    makeMaybeNode({ uid, name: `${uid}.txt`, type: 'file' as NodeType, parentUid: 'root' })
                );
            }
            bridge.setIterateNodesError('n2', new SearchLibraryError('wasm exploded', null));

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }),
                makeNodeEvent('node_created', 'n2', { parentNodeUid: 'root' }),
                makeNodeEvent('node_created', 'n3', { parentNodeUid: 'root' }),
            ];

            await expect(populator.processIncrementalUpdates(events, ctx)).rejects.toThrow('wasm exploded');

            // Only n1 should have been indexed
            await expectIndexed('n1');
            await expectIndexed('n3', 0);
        });

        it('handles fast_forward events (counted as processed)', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [makeDriveEvent('fast_forward', 'ff-1')];

            const result = await populator.processIncrementalUpdates(events, ctx);

            expect(result).toBe(1);
        });

        it('returns early on tree_refresh with processed+1 count and enqueues IndexPopulatorTask', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'n1',
                makeMaybeNode({ uid: 'n1', name: 'a.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }),
                makeDriveEvent('tree_refresh', 'tr-1'),
                makeNodeEvent('node_created', 'n2', { parentNodeUid: 'root' }),
            ];

            const result = await populator.processIncrementalUpdates(events, ctx);

            // 1 node_created + 1 tree_refresh = 2
            expect(result).toBe(2);

            expect(ctx.enqueueOnce).toHaveBeenCalledWith(expect.any(IndexPopulatorTask));
        });

        it('processes a structural folder update inline, then applies a related follow-up event in the same batch', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-y',
                makeMaybeNode({ uid: 'child-y', name: 'y.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root' }),
                // Related follow-up: create a child in the same folder. Since the folder's
                // re-index (walk + sweep) completes inline first, child-y is inserted afterwards
                // and is NOT clobbered by the sweep.
                makeNodeEvent('node_created', 'child-y', { parentNodeUid: 'folder-a' }),
            ];

            const result = await populator.processIncrementalUpdates(events, ctx);

            // Whole batch consumed in one cycle; the follow-up child survives.
            expect(result).toBe(2);
            await expectIndexed('folder-a');
            await expectIndexed('child-y');
            expect(
                await db.getBFSVisitorState(
                    NodeTreeIndexPopulator.subtreeVisitorId(IndexKind.MAIN, SCOPE_ID, 'folder-a')
                )
            ).toBeUndefined();
        });

        it('bumps generation on tree_refresh and persists state', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [makeDriveEvent('tree_refresh', 'tr-1')];

            await populator.processIncrementalUpdates(events, ctx);

            expect(await populator.getGeneration(db)).toBe(2);

            const state = await db.getPopulatorState(populator.getUid());
            expect(state?.done).toBe(false);
            expect(state?.generation).toBe(2);
        });

        it('tears down the scope on tree_remove, leaves the event uncommitted, and stops processing the batch', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeDriveEvent('tree_remove', 'none'),
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }), // should not be processed
            ];

            const result = await populator.processIncrementalUpdates(events, ctx);

            // Nothing before tree_remove, so nothing is committed (cursor stays before it).
            expect(result).toBe(0);
            // Teardown: cleanup sweep enqueued and the subscription/DB rows removed.
            expect(ctx.enqueueOnce).toHaveBeenCalledWith(expect.any(CleanUpStaleIndexEntryTask));
            expect(await db.getSubscription(SCOPE_ID)).toBeUndefined();
            // Trailing node_created was not processed.
            await expectIndexed('n1', 0);
        });

        it('commits the prefix before a mid-batch tree_remove but not the tree_remove itself', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'n1',
                makeMaybeNode({ uid: 'n1', name: 'a.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }),
                makeDriveEvent('tree_remove', 'none'),
                makeNodeEvent('node_created', 'n2', { parentNodeUid: 'root' }), // should not be processed
            ];

            const result = await populator.processIncrementalUpdates(events, ctx);

            // Only the 1 event before tree_remove is committed.
            expect(result).toBe(1);
            expect(ctx.enqueueOnce).toHaveBeenCalledWith(expect.any(CleanUpStaleIndexEntryTask));
            await expectIndexed('n1');
            await expectIndexed('n2', 0);
        });

        it('handles shared_with_me_updated without stopping', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'n1',
                makeMaybeNode({ uid: 'n1', name: 'a.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeDriveEvent('shared_with_me_updated', 'swm-1'),
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }),
            ];

            const result = await populator.processIncrementalUpdates(events, ctx);

            expect(result).toBe(2);
        });

        it('returns 0 for empty events array', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const result = await populator.processIncrementalUpdates([], ctx);

            expect(result).toBe(0);
        });
    });

    // =========================================================================
    // handleNodeUpdated — error paths
    // =========================================================================
    describe('handleNodeUpdated error paths', () => {
        it('removes the node instead of throwing when it is already gone', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_updated', 'missing-node', { parentNodeUid: 'root' });
            await expect(populator.processNodeMutation(event, ctx)).resolves.toBeUndefined();
        });

        it('throws when resolveParentPath fails', async () => {
            bridge.setNode(
                'child',
                makeMaybeNode({
                    uid: 'child',
                    name: 'child.txt',
                    type: 'file' as NodeType,
                    parentUid: 'missing-parent',
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_updated', 'child', { parentNodeUid: 'missing-parent' });
            await expect(populator.processNodeMutation(event, ctx)).rejects.toThrow();
        });
    });

    // =========================================================================
    // handleNodeCreated — undecryptable name fallback
    // =========================================================================
    describe('handleNodeCreated with undecryptable name', () => {
        it('indexes a node with undecryptable name using fallback', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode('bad-name', makeUndecryptableNode({ uid: 'bad-name', parentUid: 'root' }));

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'bad-name', { parentNodeUid: 'root' });
            await populator.processNodeMutation(event, ctx);

            await expectIndexed('bad-name');
        });
    });

    // =========================================================================
    // repairNode (replay of a quarantined node)
    // =========================================================================
    describe('repairNode', () => {
        const makeRepairEntry = (overrides: Partial<RepairNodeEntry>): RepairNodeEntry => ({
            nodeUid: 'node-1',
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'test-pop',
            treeEventScopeId: SCOPE_ID,
            operation: 'index',
            attempts: 0,
            firstFailedAt: 0,
            lastAttemptAt: 0,
            nextAttemptAt: 0,
            ...overrides,
        });

        it("'index' re-fetches the node and upserts it", async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'repaired-file',
                makeMaybeNode({ uid: 'repaired-file', name: 'fixed.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await populator.repairNode(makeRepairEntry({ nodeUid: 'repaired-file', parentNodeUid: 'root' }), ctx);

            await expectIndexed('repaired-file');
        });

        it("'index' resolves cleanly instead of retrying forever when the node was deleted while quarantined", async () => {
            // The node is never registered, simulating that it was deleted before repair ran.
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await expect(
                populator.repairNode(
                    makeRepairEntry({ nodeUid: 'gone', operation: 'index', parentNodeUid: 'root' }),
                    ctx
                )
            ).resolves.toBeUndefined();

            await expectIndexed('gone', 0);
        });

        it("'remove' removes the node and its descendants", async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child',
                makeMaybeNode({ uid: 'child', name: 'c.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            // Index the folder and a descendant first.
            await populator.processNodeMutation(
                makeNodeEvent('node_created', 'folder-a', { parentNodeUid: 'root' }),
                ctx
            );
            await populator.processNodeMutation(
                makeNodeEvent('node_created', 'child', { parentNodeUid: 'folder-a' }),
                ctx
            );
            await expectIndexed('folder-a');
            await expectIndexed('child');

            await populator.repairNode(makeRepairEntry({ nodeUid: 'folder-a', operation: 'remove' }), ctx);

            await expectIndexed('folder-a', 0);
            await expectIndexed('child', 0);
        });
    });
});
