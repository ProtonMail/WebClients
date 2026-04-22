import type { MaybeNode, NodeEntity } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import { createMockNodeEntity } from '../../../../../../../utils/test/nodeEntity';
import { SearchDB } from '../../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../../shared/types';
import { FakeMainThreadBridge } from '../../../../testing/FakeMainThreadBridge';
import { findDocumentsByTag } from '../../../../testing/indexHelpers';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import { TreeSubscriptionRegistry } from '../../TreeSubscriptionRegistry';
import { NodeTreeIndexPopulator } from '../../indexPopulators/NodeTreeIndexPopulator';
import type { TaskContext } from '../BaseTask';
import { IndexPopulatorTask } from './IndexPopulatorTask';

setupRealSearchLibraryWasm();

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeMaybeNode = (overrides: Partial<NodeEntity> = {}): MaybeNode =>
    ({ ok: true, value: createMockNodeEntity(overrides) }) as unknown as MaybeNode;

class TestPopulator extends NodeTreeIndexPopulator {
    constructor(version = 1) {
        super(SCOPE_ID, IndexKind.MAIN, 'test-pop', version);
    }

    protected async getRootNodeUid(): Promise<string> {
        return 'root';
    }
}

describe('IndexPopulatorTask', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);

        bridge.setChildren('root', [
            makeMaybeNode({ uid: 'file-1', name: 'report.pdf', type: 'file' as any }),
            makeMaybeNode({ uid: 'file-2', name: 'notes.txt', type: 'file' as any }),
        ]);
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

    it('registers tree subscription and indexes files', async () => {
        const populator = new TestPopulator();
        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, true).execute(ctx);

        // Verify subscription registered
        const reg = ctx.treeSubscriptionRegistry.getRegistration(populator);
        expect(reg).toBeDefined();

        // Verify documents are searchable
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const results = await findDocumentsByTag(instance.indexReader, 'indexPopulatorId', 'test-pop');
        const ids = results.map((r) => r.identifier).sort();
        expect(ids).toEqual(['file-1', 'file-2']);
    });

    it('skips scan when persisted state says done', async () => {
        const populator = new TestPopulator();
        await db.putPopulatorState({
            uid: populator.getUid(),
            done: true,
            generation: 1,
            version: 1,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        });

        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, true).execute(ctx);

        // Should NOT have indexed anything
        const keys = await db.getAllIndexBlobKeys();
        expect(keys).toHaveLength(0);
    });

    it('marks initial indexing when isBootstrap=true', async () => {
        const populator = new TestPopulator();
        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, true /* isBootstrap */).execute(ctx);

        expect(ctx.markInitialIndexing).toHaveBeenCalled();
        expect(ctx.markIndexing).toHaveBeenCalled();
    });

    it('does not mark initial indexing when isBootstrap=false', async () => {
        const populator = new TestPopulator();
        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, false /* isBootstrap */).execute(ctx);

        expect(ctx.markInitialIndexing).not.toHaveBeenCalled();
        expect(ctx.markIndexing).toHaveBeenCalled();
    });

    it('resolves lastEventId from DB when subscription exists', async () => {
        // Simulate that treeEventScopeId already exists in DB:
        await db.putSubscription({ treeEventScopeId: SCOPE_ID, lastEventId: 'evt-from-db', lastEventIdTime: 1000 });

        const populator = new TestPopulator();
        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, true /* isBootstrap */).execute(ctx);

        expect(bridge.fetchedEventIdScopes).toHaveLength(0);

        const reg = ctx.treeSubscriptionRegistry.getRegistration(populator);
        expect(reg?.lastEventId).toBe('evt-from-db');
    });

    it('resolves lastEventId from API when no subscription exists', async () => {
        const populator = new TestPopulator();
        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, true /* isBootstrap */).execute(ctx);

        expect(bridge.fetchedEventIdScopes).toContain(SCOPE_ID);

        const reg = ctx.treeSubscriptionRegistry.getRegistration(populator);
        expect(reg?.lastEventId).toBe('evt-1'); // 'evt-1' i ssent by fetchLastEventIdForTreeScopeId fake implementation.
    });

    it('re-indexes when persisted state is done but version changed', async () => {
        // Simulate new index populator with a new version #2
        const populator = new TestPopulator(2 /* version */);

        // Simulate that the version #1 for this populator already ran successfully
        await db.putPopulatorState({
            uid: populator.getUid(),
            done: true,
            generation: 1,
            version: 1,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        });

        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, false).execute(ctx);

        // Should have indexed despite done=true, because version mismatched.
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const results = await findDocumentsByTag(instance.indexReader, 'indexPopulatorId', 'test-pop');
        expect(results).toHaveLength(2);

        // Persisted state should reflect the new version and bumped generation.
        const state = await db.getPopulatorState(populator.getUid());
        expect(state).toEqual({
            uid: populator.getUid(),
            done: true,
            generation: 2,
            version: 2,
            progress: { files: 2, folders: 0, albums: 0, photos: 0 },
        });
    });

    it('re-indexes when persisted state has no version (legacy DB)', async () => {
        // Simulate a legacy DB entry without version field.
        await db.putPopulatorState({ uid: 'test-pop:scope-1', done: true, generation: 3 } as any);

        const populator = new TestPopulator();
        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, false).execute(ctx);

        // Should have re-indexed because undefined !== 1.
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const results = await findDocumentsByTag(instance.indexReader, 'indexPopulatorId', 'test-pop');
        expect(results).toHaveLength(2);
    });

    it('persists populator state as done after success', async () => {
        const populator = new TestPopulator();
        const ctx = await buildCtx();
        await new IndexPopulatorTask(populator, true /* isBootstrap */).execute(ctx);

        const state = await db.getPopulatorState(populator.getUid());
        expect(state).toEqual({
            uid: populator.getUid(),
            done: true,
            generation: 1,
            version: 1,
            progress: { files: 2, folders: 0, albums: 0, photos: 0 },
        });
    });
});
