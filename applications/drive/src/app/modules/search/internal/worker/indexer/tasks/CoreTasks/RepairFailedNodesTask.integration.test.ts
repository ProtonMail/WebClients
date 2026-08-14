import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { NodeEvent } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { NodeEntity, NodeType } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { SearchDB } from '../../../../shared/SearchDB';
import { RepairableNodeError } from '../../../../shared/errors';
import type { TreeEventScopeId } from '../../../../shared/types';
import { FakeMainThreadBridge } from '../../../../testing/FakeMainThreadBridge';
import { findDocumentsByTag } from '../../../../testing/indexHelpers';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import { TreeSubscriptionRegistry } from '../../TreeSubscriptionRegistry';
import type { IndexEntry } from '../../indexEntry';
import { NodeTreeIndexPopulator } from '../../indexPopulators/NodeTreeIndexPopulator';
import type { TaskContext } from '../BaseTask';
import { IndexPopulatorTask } from './IndexPopulatorTask';
import { RepairFailedNodesTask } from './RepairFailedNodesTask';

setupRealSearchLibraryWasm();

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Omit<Partial<NodeEntity>, 'name'> & { name?: string } = {}): NodeEntity => {
    const { name, ...rest } = overrides;
    return createMockNodeEntity({
        ...rest,
        ...(name !== undefined ? { name: { ok: true, value: name } } : {}),
    });
};

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

const nodeUpdated = (nodeUid: string, parentNodeUid: string, eventId: string): NodeEvent =>
    ({
        type: 'node_updated',
        nodeUid,
        parentNodeUid,
        isTrashed: false,
        isShared: false,
        treeEventScopeId: SCOPE_ID,
        eventId,
    }) as unknown as NodeEvent;

/**
 * A populator whose per-node index mapping can be made to fail on demand, simulating a node whose
 * fields can't be decrypted. The failing step (createEntryForNode) is the one shared by initial
 * indexing, incremental updates, and the repair replay, so a single toggle drives every path.
 */
class DecryptionControllablePopulator extends NodeTreeIndexPopulator {
    private readonly undecryptable = new Set<string>();

    constructor() {
        super(SCOPE_ID, IndexKind.MAIN, 'test-pop', 1);
    }

    protected async getRootNodeUid(): Promise<string> {
        return 'root';
    }

    failDecryptionFor(nodeUid: string): void {
        this.undecryptable.add(nodeUid);
    }

    recoverDecryptionFor(nodeUid: string): void {
        this.undecryptable.delete(nodeUid);
    }

    protected createEntryForNode(
        node: NodeEntity,
        parentPath: string,
        generation: number,
        reindexEpoch = 0
    ): IndexEntry {
        if (this.undecryptable.has(node.uid)) {
            throw new RepairableNodeError(`simulated decryption failure for ${node.uid}`, null);
        }
        return super.createEntryForNode(node, parentPath, generation, reindexEpoch);
    }
}

describe('RepairFailedNodesTask integration', () => {
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

    const buildCtx = async (populator: NodeTreeIndexPopulator): Promise<TaskContext> => {
        const treeSubscriptionRegistry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
        return makeTaskContext({
            bridge: bridge.asBridge(),
            db,
            indexRegistry,
            treeSubscriptionRegistry,
            getIndexPopulator: (uid) => (uid === populator.getUid() ? populator : undefined),
        });
    };

    const indexedUids = async (): Promise<string[]> => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const results = await findDocumentsByTag(instance.indexReader, 'indexPopulatorKind', 'test-pop');
        return results.map((r) => r.identifier).sort();
    };

    it('initial indexing: quarantines a node that fails decryption, then repairs it once decryption recovers', async () => {
        const populator = new DecryptionControllablePopulator();
        populator.failDecryptionFor('file-2');

        bridge.setChildren('root', [
            makeMaybeNode({ uid: 'file-1', name: 'a.pdf', type: 'file' as NodeType, parentUid: 'root' }),
            makeMaybeNode({ uid: 'file-2', name: 'b.pdf', type: 'file' as NodeType, parentUid: 'root' }),
        ]);
        // Repair replays via getNode, so the failing node and the root (for parentPath) must resolve.
        bridge.setNode('root', makeMaybeNode({ uid: 'root', parentUid: undefined, type: 'folder' as NodeType }));
        bridge.setNode(
            'file-2',
            makeMaybeNode({ uid: 'file-2', name: 'b.pdf', type: 'file' as NodeType, parentUid: 'root' })
        );

        const ctx = await buildCtx(populator);

        // Initial indexing: file-1 is indexed, file-2 is quarantined and skipped (cursor still completes).
        await new IndexPopulatorTask(populator).execute(ctx);

        expect(await indexedUids()).toEqual(['file-1']);
        const quarantined = await db.getAllRepairEntries();
        expect(quarantined).toHaveLength(1);
        expect(quarantined[0]).toMatchObject({
            nodeUid: 'file-2',
            operation: 'index',
            indexPopulatorKind: 'test-pop',
            treeEventScopeId: SCOPE_ID,
            parentNodeUid: 'root',
        });

        // Decryption now succeeds; the next repair cycle re-indexes file-2 and clears its entry.
        populator.recoverDecryptionFor('file-2');
        await new RepairFailedNodesTask().execute(ctx);

        expect(await indexedUids()).toEqual(['file-1', 'file-2']);
        expect(await db.getAllRepairEntries()).toHaveLength(0);
    });

    it('incremental updates: quarantines a node_created that fails decryption, then repairs it once decryption recovers', async () => {
        const populator = new DecryptionControllablePopulator();
        populator.failDecryptionFor('file-x');

        bridge.setNode('root', makeMaybeNode({ uid: 'root', parentUid: undefined, type: 'folder' as NodeType }));
        bridge.setNode(
            'file-x',
            makeMaybeNode({ uid: 'file-x', name: 'x.pdf', type: 'file' as NodeType, parentUid: 'root' })
        );

        const ctx = await buildCtx(populator);

        // The create event fails to map and is quarantined; the cursor still advances past it.
        const processed = await populator.processIncrementalUpdates([nodeCreated('file-x', 'e1')], ctx);
        expect(processed).toBe(1);

        expect(await indexedUids()).toEqual([]);
        const quarantined = await db.getAllRepairEntries();
        expect(quarantined).toHaveLength(1);
        expect(quarantined[0]).toMatchObject({
            nodeUid: 'file-x',
            operation: 'index',
            indexPopulatorKind: 'test-pop',
            treeEventScopeId: SCOPE_ID,
            parentNodeUid: 'root',
        });

        // Decryption now succeeds; the next repair cycle indexes file-x and clears its entry.
        populator.recoverDecryptionFor('file-x');
        await new RepairFailedNodesTask().execute(ctx);

        expect(await indexedUids()).toEqual(['file-x']);
        expect(await db.getAllRepairEntries()).toHaveLength(0);
    });

    it('subtree re-index keeps a quarantined (previously-indexed) child searchable instead of sweeping it', async () => {
        const populator = new DecryptionControllablePopulator();

        // A folder with two children, all indexed cleanly on the initial walk (epoch 0).
        bridge.setChildren('root', [
            makeMaybeNode({ uid: 'folder-f', name: 'F', type: 'folder' as NodeType, parentUid: 'root' }),
        ]);
        bridge.setChildren('folder-f', [
            makeMaybeNode({ uid: 'child-a', name: 'a.pdf', type: 'file' as NodeType, parentUid: 'folder-f' }),
            makeMaybeNode({ uid: 'child-b', name: 'b.pdf', type: 'file' as NodeType, parentUid: 'folder-f' }),
        ]);
        bridge.setNode('root', makeMaybeNode({ uid: 'root', parentUid: undefined, type: 'folder' as NodeType }));
        bridge.setNode(
            'folder-f',
            makeMaybeNode({ uid: 'folder-f', name: 'F', type: 'folder' as NodeType, parentUid: 'root' })
        );
        bridge.setNode(
            'child-b',
            makeMaybeNode({ uid: 'child-b', name: 'b.pdf', type: 'file' as NodeType, parentUid: 'folder-f' })
        );

        const ctx = await buildCtx(populator);
        await new IndexPopulatorTask(populator).execute(ctx);
        expect(await indexedUids()).toEqual(['child-a', 'child-b', 'folder-f']);

        // A folder update re-indexes the subtree under a new epoch. child-b now fails decryption
        // during the re-walk, so it is quarantined and not re-stamped with the new epoch.
        populator.failDecryptionFor('child-b');
        await populator.processIncrementalUpdates([nodeUpdated('folder-f', 'root', 'e1')], ctx);

        // child-b is quarantined but its stale entry must NOT be swept as obsolete - it was reported
        // by the SDK and only failed to re-index, so it stays searchable until the repair replays it.
        expect((await db.getAllRepairEntries()).map((e) => e.nodeUid)).toEqual(['child-b']);
        expect(await indexedUids()).toEqual(['child-a', 'child-b', 'folder-f']);

        // Decryption recovers; the repair cycle re-indexes child-b fresh and clears its entry.
        populator.recoverDecryptionFor('child-b');
        await new RepairFailedNodesTask().execute(ctx);

        expect(await db.getAllRepairEntries()).toHaveLength(0);
        expect(await indexedUids()).toEqual(['child-a', 'child-b', 'folder-f']);
    });
});
