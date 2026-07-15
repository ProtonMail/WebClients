import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../shared/SearchDB';
import type { IndexPopulatorState } from '../../shared/SearchDB';
import type { TreeEventScopeId } from '../../shared/types';
import { IndexKind } from '../../shared/types';
import { FakeMainThreadBridge } from '../../testing/FakeMainThreadBridge';
import { findDocumentsByTag, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { makeTaskContext } from '../../testing/makeTaskContext';
import { makeTestPopulator } from '../../testing/makeTestPopulator';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import type { IndexReader } from '../index/IndexReader';
import { IndexRegistry } from '../index/IndexRegistry';
import { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';
import type { AttributeValue, IndexEntry } from './indexEntry';
import { IndexPopulator } from './indexPopulators/IndexPopulator';
import { removeTreeEventScope } from './removeTreeEventScope';
import type { TaskContext } from './tasks/BaseTask';
import { CleanUpStaleIndexEntryTask } from './tasks/CleanUpTasks/CleanUpStaleIndexEntryTask';

setupRealSearchLibraryWasm();

jest.mock('../../shared/errors', () => ({
    sendErrorReportForSearch: jest.fn(),
}));

const SCOPE_A = 'scope-a' as TreeEventScopeId;
const SCOPE_B = 'scope-b' as TreeEventScopeId;
const KIND_A = 'pop-a';
const KIND_B = 'pop-b';

const findByScope = (reader: IndexReader, scope: TreeEventScopeId) =>
    findDocumentsByTag(reader, 'treeEventScopeId', scope);

describe('removeTreeEventScope', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;
    let registry: TreeSubscriptionRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
        registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
    });

    const classificationAttrs = (scope: TreeEventScopeId, kind: string): Record<string, AttributeValue> => ({
        treeEventScopeId: { kind: 'tag', value: scope },
        indexPopulatorKind: { kind: 'tag', value: kind },
        indexPopulatorVersion: { kind: 'integer', value: 1n },
        indexPopulatorGeneration: { kind: 'integer', value: 1n },
    });

    const populatorState = (scope: TreeEventScopeId, kind: string): IndexPopulatorState => ({
        uid: IndexPopulator.buildUid(kind, scope),
        indexKind: IndexKind.MAIN,
        indexPopulatorKind: kind,
        treeEventScopeId: scope,
        generation: 1,
        version: 1,
        done: true,
        progress: { files: 0, folders: 0, albums: 0, photos: 0 },
    });

    /** Seed a scope: register a subscription, insert index entries, and persist its populator state. */
    const seedScope = async (scope: TreeEventScopeId, kind: string, entryIds: string[]) => {
        const populator = makeTestPopulator(kind, scope);
        await registry.register(scope, populator, 'evt-1', 1000);

        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const entries: IndexEntry[] = entryIds.map((id) => makeTestIndexEntry(id, classificationAttrs(scope, kind)));
        await indexDocuments(instance.indexWriter, entries);

        await db.putPopulatorState(populatorState(scope, kind));
        return populator;
    };

    const buildCtx = (): TaskContext =>
        makeTaskContext({
            bridge: bridge.asBridge(),
            db,
            indexRegistry,
            treeSubscriptionRegistry: registry,
            activeIndexPopulators: [
                { indexPopulatorKind: KIND_A, treeEventScopeId: SCOPE_A },
                { indexPopulatorKind: KIND_B, treeEventScopeId: SCOPE_B },
            ],
        });

    it('tears down the scope subscription, DB rows, and (via the sweep) its index entries, leaving other scopes intact', async () => {
        const populatorA = await seedScope(SCOPE_A, KIND_A, ['a1', 'a2']);
        const populatorB = await seedScope(SCOPE_B, KIND_B, ['b1', 'b2']);
        const ctx = buildCtx();

        await removeTreeEventScope(SCOPE_A, ctx);

        // 1. Subscription torn down for A only.
        expect(registry.getRegistration(populatorA)).toBeUndefined();
        expect(bridge.wasDisposed(SCOPE_A)).toBe(true);
        expect(registry.getRegistration(populatorB)).toBeDefined();
        expect(bridge.wasDisposed(SCOPE_B)).toBe(false);

        // 2. DB subscription row deleted for A only.
        expect(await db.getSubscription(SCOPE_A)).toBeUndefined();
        expect(await db.getSubscription(SCOPE_B)).toBeDefined();

        // 3. Populator state deleted for A only.
        const states = await db.getAllPopulatorStates();
        expect(states.some((s) => s.treeEventScopeId === SCOPE_A)).toBe(false);
        expect(states.some((s) => s.treeEventScopeId === SCOPE_B)).toBe(true);

        // 4. Deleting the state orphaned A's entries, so a cleanup sweep removes them; B's remain.
        await new CleanUpStaleIndexEntryTask().execute(ctx);
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        expect(await findByScope(instance.indexReader, SCOPE_A)).toHaveLength(0);
        expect(await findByScope(instance.indexReader, SCOPE_B)).toHaveLength(2);
    });

    it('does not throw for a scope with no entries or rows', async () => {
        const ctx = buildCtx();
        await expect(removeTreeEventScope('scope-empty' as TreeEventScopeId, ctx)).resolves.toBeUndefined();
    });

    it('is idempotent: running twice leaves the same end state', async () => {
        await seedScope(SCOPE_A, KIND_A, ['a1']);
        const ctx = buildCtx();

        await removeTreeEventScope(SCOPE_A, ctx);
        await expect(removeTreeEventScope(SCOPE_A, ctx)).resolves.toBeUndefined();

        expect(await db.getSubscription(SCOPE_A)).toBeUndefined();
        const states = await db.getAllPopulatorStates();
        expect(states.some((s) => s.treeEventScopeId === SCOPE_A)).toBe(false);
    });
});
