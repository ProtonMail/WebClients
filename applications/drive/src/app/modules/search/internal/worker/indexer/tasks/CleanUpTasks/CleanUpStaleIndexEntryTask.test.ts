import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import { SearchDB } from '../../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../../shared/types';
import { findTestIndexEntries, indexDocuments, makeTestIndexEntry } from '../../../../testing/indexHelpers';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import type { AttributeValue, IndexEntry } from '../../indexEntry';
import { CleanUpStaleIndexEntryTask } from './CleanUpStaleIndexEntryTask';

setupRealSearchLibraryWasm();

jest.mock('../../../../shared/errors', () => {
    const actual = jest.requireActual('../../../../shared/errors');
    return {
        ...actual,
        sendErrorReportForSearch: jest.fn(),
    };
});

type PopulatorEntryAttrs = {
    populatorId: string;
    scopeId: string;
    version: number;
    generation: number;
};

function entryWith(id: string, p: PopulatorEntryAttrs, extra: Record<string, AttributeValue> = {}): IndexEntry {
    return makeTestIndexEntry(id, {
        indexPopulatorId: { kind: 'tag', value: p.populatorId },
        treeEventScopeId: { kind: 'tag', value: p.scopeId },
        indexPopulatorVersion: { kind: 'integer', value: BigInt(p.version) },
        indexPopulatorGeneration: { kind: 'integer', value: BigInt(p.generation) },
        ...extra,
    });
}

async function getRemainingIds(
    indexReader: Awaited<ReturnType<IndexRegistry['get']>>['indexReader']
): Promise<string[]> {
    const results = await findTestIndexEntries(indexReader);
    return results.map((r) => r.identifier).sort();
}

describe('CleanUpStaleIndexEntryTask', () => {
    let db: SearchDB;
    let indexRegistry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
    });

    it('is a no-op when there are no populator states and no engines', async () => {
        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await db.getAllPopulatorStates()).toEqual([]);
    });

    it('is a no-op when all entries match the current state, populator and scope', async () => {
        const p = { populatorId: 'myfiles', scopeId: 'vol-1', version: 2, generation: 3 };
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [entryWith('doc-1', p), entryWith('doc-2', p)]);
        await db.putPopulatorState({
            uid: `${p.populatorId}:${p.scopeId}`,
            generation: p.generation,
            version: p.version,
            done: true,
            progress: { files: 2, folders: 0, albums: 0, photos: 0 },
        });

        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual(['doc-1', 'doc-2']);
    });

    it('removes entries from a previous generation', async () => {
        const common = { populatorId: 'myfiles', scopeId: 'vol-1', version: 1 };
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            entryWith('old-1', { ...common, generation: 1 }),
            entryWith('old-2', { ...common, generation: 1 }),
            entryWith('new-1', { ...common, generation: 2 }),
        ]);
        await db.putPopulatorState({
            uid: `${common.populatorId}:${common.scopeId}`,
            generation: 2,
            version: 1,
            done: true,
            progress: { files: 1, folders: 0, albums: 0, photos: 0 },
        });

        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual(['new-1']);
    });

    it('removes entries whose version is outdated', async () => {
        const common = { populatorId: 'myfiles', scopeId: 'vol-1', generation: 1 };
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            entryWith('v1-doc', { ...common, version: 1 }),
            entryWith('v2-doc', { ...common, version: 2 }),
        ]);
        await db.putPopulatorState({
            uid: `${common.populatorId}:${common.scopeId}`,
            generation: 1,
            version: 2,
            done: true,
            progress: { files: 1, folders: 0, albums: 0, photos: 0 },
        });

        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual(['v2-doc']);
    });

    it('removes entries whose populator id is no longer active', async () => {
        const p = { populatorId: 'retired', scopeId: 'vol-1', version: 1, generation: 3 };
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [entryWith('retired-doc', p)]);
        await db.putPopulatorState({
            uid: `${p.populatorId}:${p.scopeId}`,
            generation: p.generation,
            version: p.version,
            done: true,
            progress: { files: 1, folders: 0, albums: 0, photos: 0 },
        });

        // 'retired' is in the DB but not in the active populator set — entries removed.
        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual([]);
    });

    it('removes entries whose tree-event-scope is no longer active', async () => {
        const p = { populatorId: 'myfiles', scopeId: 'vol-removed', version: 1, generation: 1 };
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [entryWith('scope-gone-doc', p)]);
        await db.putPopulatorState({
            uid: `${p.populatorId}:${p.scopeId}`,
            generation: p.generation,
            version: p.version,
            done: true,
            progress: { files: 1, folders: 0, albums: 0, photos: 0 },
        });

        // Populator id is still active, but its scope is gone — entries removed.
        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual([]);
    });

    it('removes entries whose populator state no longer exists (orphan)', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            entryWith('orphan-1', {
                populatorId: 'legacy-populator',
                scopeId: 'vol-1',
                version: 1,
                generation: 1,
            }),
        ]);
        // No populator state persisted for 'legacy-populator:vol-1'.

        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual([]);
    });

    it('handles multiple populators with distinct scopes', async () => {
        const a = { populatorId: 'myfiles', scopeId: 'vol-a', version: 1, generation: 2 };
        const b = { populatorId: 'myfiles', scopeId: 'vol-b', version: 1, generation: 1 };
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            entryWith('a-current', a),
            entryWith('a-stale', { ...a, generation: 1 }),
            entryWith('b-current', b),
        ]);
        await db.putPopulatorState({
            uid: `${a.populatorId}:${a.scopeId}`,
            generation: a.generation,
            version: a.version,
            done: true,
            progress: { files: 1, folders: 0, albums: 0, photos: 0 },
        });
        await db.putPopulatorState({
            uid: `${b.populatorId}:${b.scopeId}`,
            generation: b.generation,
            version: b.version,
            done: true,
            progress: { files: 1, folders: 0, albums: 0, photos: 0 },
        });

        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [
                { indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-a' as TreeEventScopeId },
                { indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-b' as TreeEventScopeId },
            ],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual(['a-current', 'b-current']);
    });

    it('continues cleaning other engines when one fails', async () => {
        const p = { populatorId: 'myfiles', scopeId: 'vol-1', version: 1, generation: 1 };
        const PHOTOS = 'photos' as IndexKind;

        const main = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(main.indexWriter, [entryWith('main-stale', { ...p, generation: 99 })]);

        const photos = await indexRegistry.get(PHOTOS, db);
        await indexDocuments(photos.indexWriter, [entryWith('photos-stale', { ...p, generation: 99 })]);

        await db.putPopulatorState({
            uid: `${p.populatorId}:${p.scopeId}`,
            generation: p.generation,
            version: p.version,
            done: true,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        });

        // Break the MAIN engine's export iterator.
        jest.spyOn(main.engine, 'export').mockImplementation(() => {
            throw new Error('simulated main failure');
        });

        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        // Photos engine still processed despite MAIN failing.
        expect(await getRemainingIds(photos.indexReader)).toEqual([]);
    });

    it('flushes write commits every 50 stale entries during the export pass', async () => {
        const p = { populatorId: 'myfiles', scopeId: 'vol-1', version: 1, generation: 2 };
        const instance = await indexRegistry.get(IndexKind.MAIN, db);

        // 51 stale entries (gen=1) + 1 kept entry (gen=2) → expect 2 write sessions (50 + 1).
        const staleEntries = Array.from({ length: 51 }, (_, i) => entryWith(`stale-${i}`, { ...p, generation: 1 }));
        await indexDocuments(instance.indexWriter, [entryWith('current', p), ...staleEntries]);
        await db.putPopulatorState({
            uid: `${p.populatorId}:${p.scopeId}`,
            generation: p.generation,
            version: p.version,
            done: true,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        });

        const startSpy = jest.spyOn(instance.indexWriter, 'startWriteSession');

        const ctx = makeTaskContext({
            indexRegistry,
            db,
            activeIndexPopulators: [{ indexPopulatorId: 'myfiles', treeEventScopeId: 'vol-1' as TreeEventScopeId }],
        });
        await new CleanUpStaleIndexEntryTask().execute(ctx);

        // Two write sessions: one for the first 50, one for the final 1.
        expect(startSpy).toHaveBeenCalledTimes(2);
        expect(await getRemainingIds(instance.indexReader)).toEqual(['current']);
    });
});
