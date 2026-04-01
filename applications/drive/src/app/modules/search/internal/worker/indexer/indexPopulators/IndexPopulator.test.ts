import type { DriveEvent, MaybeNode, NodeEntity, NodeEvent, NodeType } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createMockDegradedNode, createMockNodeEntity } from '../../../../../../utils/test/nodeEntity';
import { SearchDB } from '../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../shared/types';
import { FakeMainThreadBridge } from '../../../testing/FakeMainThreadBridge';
import { findDocumentsByTag } from '../../../testing/indexHelpers';
import { makeTaskContext } from '../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../index/IndexRegistry';
import { TreeSubscriptionRegistry } from '../TreeSubscriptionRegistry';
import type { IndexEntry } from '../indexEntry';
import type { TaskContext } from '../tasks/BaseTask';
import { IndexPopulatorTask } from '../tasks/CoreTasks/IndexPopulatorTask';
import { RemoveTreeEventScopeIdTask } from '../tasks/CoreTasks/RemoveTreeEventScopeIdTask';
import { IndexPopulator } from './IndexPopulator';

setupRealSearchLibraryWasm();

jest.mock('../../../shared/errors', () => ({
    sendErrorReportForSearch: jest.fn(),
}));

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Partial<NodeEntity> = {}): MaybeNode => ({
    ok: true,
    value: createMockNodeEntity(overrides),
});

const makeUndecryptableNode = (overrides: Omit<Partial<NodeEntity>, 'name' | 'activeRevision'> = {}): MaybeNode => ({
    ok: false,
    error: createMockDegradedNode({
        ...overrides,
        name: { ok: false, error: new Error('decryption failed') },
    }),
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
 * Concrete test populator that yields nothing during initial scan.
 * We only test incremental update logic here.
 */
class TestPopulator extends IndexPopulator {
    constructor(generation = 1) {
        super(SCOPE_ID, IndexKind.MAIN, 'test-pop', 1, generation);
    }

    async *visitAndProduceIndexEntries(_ctx: TaskContext): AsyncIterableIterator<IndexEntry> {
        // no-op for these tests
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
        indexRegistry = new IndexRegistry();
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

        it('skips trashed nodes (event.isTrashed)', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'trashed-node', { isTrashed: true });
            await populator.processNodeMutation(event, ctx);

            await expectIndexed('trashed-node', 0);
        });

        it('throws when getNode fails', async () => {
            // Don't register the node — getNode will throw
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_created', 'missing-node');
            await expect(populator.processNodeMutation(event, ctx)).rejects.toThrow();
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

        it('treats trashed update as delete', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'file-1',
                makeMaybeNode({ uid: 'file-1', name: 'hello.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'file-1', 'root');
            await expectIndexed('file-1');

            await populator.processNodeMutation(makeNodeEvent('node_updated', 'file-1', { isTrashed: true }), ctx);

            await expectIndexed('file-1', 0);
        });

        it('trashed update removes descendants', async () => {
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

            await populator.processNodeMutation(makeNodeEvent('node_updated', 'folder-a', { isTrashed: true }), ctx);

            await expectIndexed('folder-a', 0);
            await expectIndexed('child-1', 0);
        });

        it('updates descendants when folder moves', async () => {
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

            // Move folder-a under folder-b
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'folder-b' })
            );
            bridge.setChildren('folder-a', [
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
            ]);

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'folder-b' }),
                ctx
            );

            // folder-a and child-1 should still be indexed
            await expectIndexed('folder-a');
            await expectIndexed('child-1');
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

        it('re-indexes folder subtree when un-trashed', async () => {
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

            // Index, then trash (remove from index)
            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-1', 'folder-a');
            await populator.processNodeMutation(makeNodeEvent('node_updated', 'folder-a', { isTrashed: true }), ctx);
            await expectIndexed('folder-a', 0);
            await expectIndexed('child-1', 0);

            // Un-trash: node_updated with isTrashed=false, children available via SDK
            bridge.setChildren('folder-a', [
                makeMaybeNode({ uid: 'child-1', name: 'c1.txt', type: 'file' as NodeType, parentUid: 'folder-a' }),
            ]);

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root', isTrashed: false }),
                ctx
            );

            await expectIndexed('folder-a');
            await expectIndexed('child-1');
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

        it('throws on first node mutation failure', async () => {
            // n1 succeeds, n2 fails (not registered in bridge)
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'n1',
                makeMaybeNode({ uid: 'n1', name: 'a.txt', type: 'file' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }),
                makeNodeEvent('node_created', 'missing', { parentNodeUid: 'root' }),
                makeNodeEvent('node_created', 'n3', { parentNodeUid: 'root' }),
            ];

            await expect(populator.processIncrementalUpdates(events, ctx)).rejects.toThrow();

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

        it('bumps generation on tree_refresh and persists state', async () => {
            const populator = new TestPopulator(/* generation */ 1);
            const ctx = await buildCtx();

            const events: DriveEvent[] = [makeDriveEvent('tree_refresh', 'tr-1')];

            await populator.processIncrementalUpdates(events, ctx);

            expect(populator.getGeneration()).toBe(2);

            const state = await db.getPopulatorState(populator.getUid());
            expect(state?.done).toBe(false);
            expect(state?.generation).toBe(2);
        });

        it('returns early on tree_remove and enqueues RemoveTreeEventScopeIdTask', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const events: DriveEvent[] = [
                makeDriveEvent('tree_remove', 'none'),
                makeNodeEvent('node_created', 'n1', { parentNodeUid: 'root' }), // should not be processed
            ];

            const result = await populator.processIncrementalUpdates(events, ctx);

            expect(result).toBe(1);

            expect(ctx.enqueueOnce).toHaveBeenCalledWith(expect.any(RemoveTreeEventScopeIdTask));
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
        it('throws when getNode fails', async () => {
            const populator = new TestPopulator();
            const ctx = await buildCtx();

            const event = makeNodeEvent('node_updated', 'missing-node', { parentNodeUid: 'root' });
            await expect(populator.processNodeMutation(event, ctx)).rejects.toThrow();
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
    // walkFolderTreeFromSdk — trashed children skipped
    // =========================================================================
    describe('walkFolderTreeFromSdk skips trashed children', () => {
        const indexNode = async (
            populator: TestPopulator,
            ctx: TaskContext,
            nodeUid: string,
            parentNodeUid?: string
        ) => {
            const event = makeNodeEvent('node_created', nodeUid, { parentNodeUid });
            await populator.processNodeMutation(event, ctx);
        };

        it('skips trashed children when re-indexing a moved folder', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'child-ok',
                makeMaybeNode({ uid: 'child-ok', name: 'ok.txt', type: 'file' as NodeType, parentUid: 'folder-a' })
            );
            bridge.setNode(
                'child-trashed',
                makeMaybeNode({
                    uid: 'child-trashed',
                    name: 'trashed.txt',
                    type: 'file' as NodeType,
                    parentUid: 'folder-a',
                    trashTime: new Date('2024-06-01'),
                })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'child-ok', 'folder-a');

            // Simulate move: SDK now returns one healthy child and one trashed child
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

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root' }),
                ctx
            );

            await expectIndexed('folder-a');
            await expectIndexed('child-ok');
            await expectIndexed('child-trashed', 0);
        });

        it('indexes undecryptable children with fallback name when re-indexing a moved folder', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');

            // SDK returns one undecryptable child (no indexable filename)
            bridge.setChildren('folder-a', [makeUndecryptableNode({ uid: 'bad-child', parentUid: 'folder-a' })]);

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'root' }),
                ctx
            );

            await expectIndexed('folder-a');
            await expectIndexed('bad-child');
        });
    });

    // =========================================================================
    // walkFolderTreeFromSdk — nested subfolder BFS
    // =========================================================================
    describe('walkFolderTreeFromSdk with nested subfolders', () => {
        const indexNode = async (
            populator: TestPopulator,
            ctx: TaskContext,
            nodeUid: string,
            parentNodeUid?: string
        ) => {
            const event = makeNodeEvent('node_created', nodeUid, { parentNodeUid });
            await populator.processNodeMutation(event, ctx);
        };

        it('re-indexes nested subfolders when a folder moves', async () => {
            bridge.setNode('root', makeMaybeNode({ uid: 'root', name: 'root', parentUid: undefined }));
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'root' })
            );
            bridge.setNode(
                'sub-folder',
                makeMaybeNode({
                    uid: 'sub-folder',
                    name: 'Sub',
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
                    parentUid: 'sub-folder',
                })
            );
            bridge.setNode(
                'folder-dest',
                makeMaybeNode({ uid: 'folder-dest', name: 'Dest', type: 'folder' as NodeType, parentUid: 'root' })
            );

            const populator = new TestPopulator();
            const ctx = await buildCtx();

            await indexNode(populator, ctx, 'folder-a', 'root');
            await indexNode(populator, ctx, 'sub-folder', 'folder-a');
            await indexNode(populator, ctx, 'deep-file', 'sub-folder');
            await indexNode(populator, ctx, 'folder-dest', 'root');

            // Move folder-a under folder-dest
            bridge.setNode(
                'folder-a',
                makeMaybeNode({ uid: 'folder-a', name: 'A', type: 'folder' as NodeType, parentUid: 'folder-dest' })
            );
            bridge.setChildren('folder-a', [
                makeMaybeNode({
                    uid: 'sub-folder',
                    name: 'Sub',
                    type: 'folder' as NodeType,
                    parentUid: 'folder-a',
                }),
            ]);
            bridge.setChildren('sub-folder', [
                makeMaybeNode({
                    uid: 'deep-file',
                    name: 'deep.txt',
                    type: 'file' as NodeType,
                    parentUid: 'sub-folder',
                }),
            ]);

            await populator.processNodeMutation(
                makeNodeEvent('node_updated', 'folder-a', { parentNodeUid: 'folder-dest' }),
                ctx
            );

            await expectIndexed('folder-a');
            await expectIndexed('sub-folder');
            await expectIndexed('deep-file');
        });
    });
});
