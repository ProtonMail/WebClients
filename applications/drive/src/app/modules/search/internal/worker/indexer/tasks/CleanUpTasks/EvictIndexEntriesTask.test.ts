import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { IndexPopulatorState } from '../../../../shared/SearchDB';
import { SearchDB } from '../../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../../shared/types';
import { findTestIndexEntries, indexDocuments, makeTestIndexEntry } from '../../../../testing/indexHelpers';
import { makeSearchMetricsSpies, makeTaskContext } from '../../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import { NodeTreeIndexPopulator } from '../../indexPopulators/NodeTreeIndexPopulator';
import type { TaskContext } from '../BaseTask';
import { EvictIndexEntriesTask } from './EvictIndexEntriesTask';

setupRealSearchLibraryWasm();

jest.mock('../../../../shared/errors', () => {
    const actual = jest.requireActual('../../../../shared/errors');
    return { ...actual, sendErrorReportForSearch: jest.fn() };
});

// SEARCH_MAX_INDEXED_DOCUMENTS is 50_000 in production, which would make every test below build a
// 50k-plus-document fake index just to exercise the trigger/removal math. Shrink it so the derived
// trigger (23) and removal (3) are realistic against small test fixtures.
jest.mock('../../../../shared/config', () => {
    const actual = jest.requireActual('../../../../shared/config');
    return { ...actual, SEARCH_MAX_INDEXED_DOCUMENTS: 20 };
});

const SCOPE_ID = 'scope-1' as TreeEventScopeId;
const POPULATOR_UID = `test-pop:${SCOPE_ID}`;

/** Minimal concrete populator, just enough to exercise markAsCapped/isCapped via the real base. */
class TestPopulator extends NodeTreeIndexPopulator {
    constructor() {
        super(SCOPE_ID, IndexKind.MAIN, 'test-pop', 1);
    }

    protected async getRootNodeUid(): Promise<string> {
        return 'root';
    }
}

async function getRemainingIds(indexReader: Awaited<ReturnType<IndexRegistry['get']>>['indexReader']) {
    const results = await findTestIndexEntries(indexReader);
    return results.map((r) => r.identifier).sort();
}

describe('EvictIndexEntriesTask', () => {
    let db: SearchDB;
    let indexRegistry: IndexRegistry;
    let populator: TestPopulator;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
        populator = new TestPopulator();
    });

    async function putPopulatorState(overrides: Partial<IndexPopulatorState> = {}): Promise<void> {
        await db.putPopulatorState({
            uid: POPULATOR_UID,
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'test-pop',
            treeEventScopeId: SCOPE_ID,
            generation: 1,
            version: 1,
            done: true,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            ...overrides,
        });
    }

    function buildCtx(overrides: Partial<TaskContext> = {}): TaskContext {
        return makeTaskContext({
            db,
            indexRegistry,
            activeIndexPopulators: [{ indexPopulatorKind: 'test-pop', treeEventScopeId: SCOPE_ID }],
            getIndexPopulator: (uid: string) => (uid === POPULATOR_UID ? populator : undefined),
            ...overrides,
        });
    }

    it('is a no-op when the index has never been opened this session', async () => {
        // peek() must never build - an index nobody has touched isn't worth building just to check.
        const ctx = buildCtx();
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);
        expect(await db.getIndexEntryCount(IndexKind.MAIN)).toBeUndefined();
    });

    it('is a no-op when under the trigger', async () => {
        // trigger = round(20 * 1.15) = 23.
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);
        await putPopulatorState({ documentCount: 23 });

        const ctx = buildCtx();
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual(['doc-1']);
        expect(await populator.isCapped(db)).toBe(false);
    });

    it('removes exactly the N oldest entries by recency, keeping the rest, and marks active populators capped', async () => {
        // removal = round(20 * 0.15) = 3, so exactly the 3 oldest of 10 must go. Recency values are
        // spread a year apart so each entry lands in its own histogram bucket (the bucket width at
        // production scale - now / 4096 buckets - is a few days; entries closer together than that
        // would tie into the same bucket, and which of a tied bucket's entries get picked up to the
        // toRemove cap is unspecified by design - see the degenerate-case test below for that case
        // instead of asserting an exact tie-break order here).
        // Recency is deliberately the REVERSE of insertion/id order (doc-0 is the most recent,
        // doc-9 the oldest), so a bug that removed by export/insertion order instead of recency
        // would be caught, rather than passing by coincidence because the two orders happen to
        // agree.
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const entries = Array.from({ length: 10 }, (_, i) =>
            makeTestIndexEntry(`doc-${i}`, {
                modificationTime: { kind: 'integer', value: BigInt(now - i * oneYearMs) },
            })
        );
        await indexDocuments(instance.indexWriter, entries);
        await putPopulatorState({ documentCount: 24 });

        const ctx = buildCtx();
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        // doc-0, doc-1, doc-2 are 0/1/2 years old - the most recent, so they must survive. doc-7,
        // doc-8, doc-9 are 7/8/9 years old - the oldest, so they must be gone.
        expect(await getRemainingIds(instance.indexReader)).toEqual([
            'doc-0',
            'doc-1',
            'doc-2',
            'doc-3',
            'doc-4',
            'doc-5',
            'doc-6',
        ]);
        expect(await populator.isCapped(db)).toBe(true);
        expect(await db.getLastEvictionAt(IndexKind.MAIN)).toBeDefined();
    });

    it('reports markIndexEvicted with the post-sweep count and removedCount', async () => {
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const entries = Array.from({ length: 10 }, (_, i) =>
            makeTestIndexEntry(`doc-${i}`, {
                modificationTime: { kind: 'integer', value: BigInt(now - i * oneYearMs) },
            })
        );
        await indexDocuments(instance.indexWriter, entries);
        await putPopulatorState({ documentCount: 24 });

        const markIndexEvicted = jest.fn();
        const ctx = buildCtx({ searchMetrics: makeSearchMetricsSpies({ markIndexEvicted }) });
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        // removal = round(20 * 0.15) = 3, so 10 - 3 = 7 remain.
        expect(markIndexEvicted).toHaveBeenCalledWith({ indexEntryCount: 7, removedCount: 3 });
    });

    it('does not report markIndexEvicted when the sweep removes nothing', async () => {
        // documentCount claims 100 but the engine holds nothing - same setup as "does not mark the
        // index capped when the sweep removes nothing" above.
        await indexRegistry.get(IndexKind.MAIN, db);
        await putPopulatorState({ documentCount: 100 });

        const markIndexEvicted = jest.fn();
        const ctx = buildCtx({ searchMetrics: makeSearchMetricsSpies({ markIndexEvicted }) });
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        expect(markIndexEvicted).not.toHaveBeenCalled();
    });

    it('keeps a document with activeRevisionCreationTime = 0 but a recent modificationTime', async () => {
        // The decisive test: recency is the MAX of the three timestamps, not the first readable
        // one. A folder-like entry (activeRevisionCreationTime = 0) with a recent modificationTime
        // must be treated as recent, not oldest.
        // removal = 3: pad with filler entries old enough to land in a lower histogram bucket than
        // recent-folder, so the sweep has unambiguous victims and never needs to consider it. Filler
        // entries also carry a (comparatively old but nonzero) activeRevisionCreationTime, so a bug
        // that used activeRevisionCreationTime alone (ignoring modificationTime) would make
        // recent-folder's deliberately-zero value the clear lowest instead of tying with the filler
        // at zero - i.e. this discriminates the bug rather than passing by export-order luck.
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const filler = Array.from({ length: 3 }, (_, i) =>
            makeTestIndexEntry(`filler-${i}`, {
                activeRevisionCreationTime: { kind: 'integer', value: BigInt(now - (10 + i) * oneYearMs) },
                modificationTime: { kind: 'integer', value: BigInt(now - (10 + i) * oneYearMs) },
            })
        );
        await indexDocuments(instance.indexWriter, [
            ...filler,
            makeTestIndexEntry('recent-folder', {
                activeRevisionCreationTime: { kind: 'integer', value: 0n },
                modificationTime: { kind: 'integer', value: BigInt(now) },
            }),
        ]);
        await putPopulatorState({ documentCount: 24 });

        const ctx = buildCtx();
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        expect(await getRemainingIds(instance.indexReader)).toEqual(['recent-folder']);
    });

    it('removes an arbitrary toRemove when every entry shares the same recency (degenerate case)', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const entries = Array.from({ length: 5 }, (_, i) =>
            makeTestIndexEntry(`doc-${i}`, { modificationTime: { kind: 'integer', value: 42n } })
        );
        await indexDocuments(instance.indexWriter, entries);
        await putPopulatorState({ documentCount: 24 });

        const ctx = buildCtx();
        // Should terminate (not loop forever) and not throw, despite every entry having identical
        // recency - there is no infinite loop hiding in the degenerate min === max branch.
        await expect(new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx)).resolves.toBeUndefined();
        // removal = 3, so exactly 2 of 5 identical-recency entries must survive.
        expect(await getRemainingIds(instance.indexReader)).toHaveLength(2);
    });

    it('does not run a second sweep before SEARCH_EVICTION_MIN_INTERVAL_MS has elapsed', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);
        await putPopulatorState({ documentCount: 24, lastEvictionAt: Date.now() });

        const ctx = buildCtx();
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        // Nothing removed and capped was never set - the sweep bailed before touching the index.
        expect(await getRemainingIds(instance.indexReader)).toEqual(['doc-1']);
        expect(await populator.isCapped(db)).toBe(false);
    });

    it('does not mark the index capped when the sweep removes nothing', async () => {
        // Reachable when the persisted documentCount that triggered the sweep is stale and higher
        // than what the engine actually holds - here it claims 100 documents but the index is
        // empty, so there is nothing to evict. `capped` is sticky (only a full re-index clears it),
        // so marking it over an eviction that never happened would leave the user permanently on
        // "Search recent items" with a complete index.
        await indexRegistry.get(IndexKind.MAIN, db);
        await putPopulatorState({ documentCount: 100 });

        const enqueueDelayed = jest.fn();
        const ctx = buildCtx({ enqueueDelayed });
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        expect(await populator.isCapped(db)).toBe(false);
        expect(await db.getLastEvictionAt(IndexKind.MAIN)).toBeUndefined();
        expect(enqueueDelayed).not.toHaveBeenCalled();
    });

    it('bases the re-enqueue decision on the real post-sweep count, not the stale triggering count', async () => {
        // The persisted count (100) is far higher than what the engine actually holds (10), which
        // happens when it predates a crash or a wipe. Subtracting the removal from that stale
        // number (100 - 3 = 97 > 23) would schedule a sweep with nothing to do; the real count
        // after the removal commits is 7, comfortably under the trigger.
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const entries = Array.from({ length: 10 }, (_, i) =>
            makeTestIndexEntry(`doc-${i}`, {
                modificationTime: { kind: 'integer', value: BigInt(now - i * oneYearMs) },
            })
        );
        await indexDocuments(instance.indexWriter, entries);
        await putPopulatorState({ documentCount: 100 });

        const enqueueDelayed = jest.fn();
        const ctx = buildCtx({ enqueueDelayed });
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        expect(await db.getIndexEntryCount(IndexKind.MAIN)).toBe(7);
        expect(enqueueDelayed).not.toHaveBeenCalled();
    });

    it('re-enqueues itself when the index is still over the trigger after removal', async () => {
        // The migration case: a genuinely large index (30 docs, trigger 23) that one sweep of 3
        // cannot bring under the trigger, so it must converge over several re-enqueued runs. The
        // re-enqueue decision reads the post-sweep count the removal commits persisted (27), not
        // pre-sweep arithmetic.
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const entries = Array.from({ length: 30 }, (_, i) =>
            makeTestIndexEntry(`doc-${i}`, {
                modificationTime: { kind: 'integer', value: BigInt(now - i * oneYearMs) },
            })
        );
        await indexDocuments(instance.indexWriter, entries);
        await putPopulatorState({ documentCount: 30 });

        const enqueueDelayed = jest.fn();
        const ctx = buildCtx({ enqueueDelayed });
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        expect(await db.getIndexEntryCount(IndexKind.MAIN)).toBe(27);
        expect(enqueueDelayed).toHaveBeenCalledTimes(1);
        const [task, delayMs] = enqueueDelayed.mock.calls[0];
        expect(task).toBeInstanceOf(EvictIndexEntriesTask);
        expect(delayMs).toBeGreaterThan(0);
    });

    it('does not re-enqueue once removal brings the index back under the trigger', async () => {
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const entries = Array.from({ length: 25 }, (_, i) =>
            makeTestIndexEntry(`doc-${i}`, {
                modificationTime: { kind: 'integer', value: BigInt(now - i * oneYearMs) },
            })
        );
        await indexDocuments(instance.indexWriter, entries);
        await putPopulatorState({ documentCount: 25 });

        const enqueueDelayed = jest.fn();
        const ctx = buildCtx({ enqueueDelayed });
        await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

        // 25 - 3 = 22, just under the trigger of 23.
        expect(await db.getIndexEntryCount(IndexKind.MAIN)).toBe(22);
        expect(enqueueDelayed).not.toHaveBeenCalled();
    });

    it('defers instead of sweeping when a search/export read is in flight', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);
        await putPopulatorState({ documentCount: 24 });

        instance.blobStore.beginRead();
        try {
            const enqueueDelayed = jest.fn();
            const ctx = buildCtx({ enqueueDelayed });
            await new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx);

            expect(enqueueDelayed).toHaveBeenCalledTimes(1);
            expect(enqueueDelayed.mock.calls[0][0]).toBeInstanceOf(EvictIndexEntriesTask);
            // Deferred, not swept: nothing removed, nothing marked capped.
            expect(await getRemainingIds(instance.indexReader)).toEqual(['doc-1']);
            expect(await populator.isCapped(db)).toBe(false);
        } finally {
            instance.blobStore.endRead();
        }
    });

    it('respects an aborted signal', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);
        await putPopulatorState({ documentCount: 24 });

        const ac = new AbortController();
        ac.abort();
        const ctx = buildCtx({ signal: ac.signal });

        await expect(new EvictIndexEntriesTask(IndexKind.MAIN).execute(ctx)).rejects.toThrow();
    });
});
