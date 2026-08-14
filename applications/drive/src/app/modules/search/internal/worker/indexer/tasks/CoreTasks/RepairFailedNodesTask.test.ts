import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { RepairNodeEntry } from '../../../../shared/SearchDB';
import { SearchDB } from '../../../../shared/SearchDB';
import { RepairableNodeError, SearchLibraryError } from '../../../../shared/errors';
import type { TreeEventScopeId } from '../../../../shared/types';
import { IndexKind } from '../../../../shared/types';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { makeTestPopulator } from '../../../../testing/makeTestPopulator';
import type { IndexPopulator } from '../../indexPopulators/IndexPopulator';
import type { TaskContext } from '../BaseTask';
import { REPAIR_RETRY_INTERVAL_MS, RepairFailedNodesTask } from './RepairFailedNodesTask';

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const seedEntry = (overrides: Partial<RepairNodeEntry> = {}): RepairNodeEntry => ({
    nodeUid: 'node-1',
    indexKind: IndexKind.MAIN,
    indexPopulatorKind: 'test-pop',
    treeEventScopeId: SCOPE_ID,
    operation: 'index',
    parentNodeUid: 'parent-1',
    attempts: 0,
    firstFailedAt: 1000,
    lastAttemptAt: 1000,
    nextAttemptAt: 0, // due by default
    ...overrides,
});

describe('RepairFailedNodesTask', () => {
    let db: SearchDB;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
    });

    const populatorWith = (repairNode: IndexPopulator['repairNode']): IndexPopulator =>
        makeTestPopulator('test-pop', SCOPE_ID, { repairNode });

    it('replays a due entry and deletes it on success', async () => {
        const repairNode = jest.fn(async (_entry: RepairNodeEntry, _ctx: TaskContext) => {});
        const populator = populatorWith(repairNode);
        await db.putRepairEntry(seedEntry({ nodeUid: 'node-1' }));

        await new RepairFailedNodesTask().execute(makeTaskContext({ db, getIndexPopulator: () => populator }));

        expect(repairNode).toHaveBeenCalledTimes(1);
        expect(repairNode.mock.calls[0][0]).toMatchObject({ nodeUid: 'node-1' });
        expect(await db.getAllRepairEntries()).toHaveLength(0);
    });

    it('keeps the entry and backs off on a node-scoped repair failure', async () => {
        const repairNode = jest.fn(async () => {
            throw new RepairableNodeError('still broken', null);
        });
        const populator = populatorWith(repairNode);
        await db.putRepairEntry(seedEntry({ nodeUid: 'node-1', attempts: 1, nextAttemptAt: 0 }));

        await new RepairFailedNodesTask().execute(makeTaskContext({ db, getIndexPopulator: () => populator }));

        const [entry] = await db.getAllRepairEntries();
        expect(entry.attempts).toBe(2);
        expect(entry.nextAttemptAt).toBeGreaterThan(Date.now());
        expect(entry.lastError).toContain('still broken');
    });

    it('skips entries that are not yet due', async () => {
        const repairNode = jest.fn(async (_entry: RepairNodeEntry, _ctx: TaskContext) => {});
        const populator = populatorWith(repairNode);
        await db.putRepairEntry(seedEntry({ nodeUid: 'node-1', nextAttemptAt: Date.now() + 1_000_000 }));

        await new RepairFailedNodesTask().execute(makeTaskContext({ db, getIndexPopulator: () => populator }));

        expect(repairNode).not.toHaveBeenCalled();
        expect(await db.getAllRepairEntries()).toHaveLength(1);
    });

    it('dispatches each entry to its owning populator and skips entries with no registered populator', async () => {
        const repairNode = jest.fn(async (_entry: RepairNodeEntry, _ctx: TaskContext) => {});
        const populator = populatorWith(repairNode);
        await db.putRepairEntry(seedEntry({ nodeUid: 'mine', indexPopulatorKind: 'test-pop' }));
        await db.putRepairEntry(seedEntry({ nodeUid: 'other', indexPopulatorKind: 'unknown-pop' }));

        const getIndexPopulator = (uid: string) => (uid === populator.getUid() ? populator : undefined);
        await new RepairFailedNodesTask().execute(makeTaskContext({ db, getIndexPopulator }));

        expect(repairNode).toHaveBeenCalledTimes(1);
        expect(repairNode.mock.calls[0][0]).toMatchObject({ nodeUid: 'mine' });
        // The entry whose populator isn't registered is left untouched for a later run.
        expect((await db.getAllRepairEntries()).map((e) => e.nodeUid)).toEqual(['other']);
    });

    it('re-throws a systemic repair failure without touching the entry', async () => {
        const repairNode = jest.fn(async () => {
            throw new SearchLibraryError('wasm exploded', null);
        });
        const populator = populatorWith(repairNode);
        await db.putRepairEntry(seedEntry({ nodeUid: 'node-1', attempts: 0 }));

        await expect(
            new RepairFailedNodesTask().execute(makeTaskContext({ db, getIndexPopulator: () => populator }))
        ).rejects.toThrow('wasm exploded');

        const [entry] = await db.getAllRepairEntries();
        expect(entry.attempts).toBe(0);
    });

    it('re-enqueues itself after REPAIR_RETRY_INTERVAL_MS, whether or not there was anything to repair', async () => {
        const enqueueDelayed = jest.fn();
        await new RepairFailedNodesTask().execute(makeTaskContext({ db, enqueueDelayed }));

        expect(enqueueDelayed).toHaveBeenCalledTimes(1);
        expect(enqueueDelayed.mock.calls[0][0]).toBeInstanceOf(RepairFailedNodesTask);
        expect(enqueueDelayed.mock.calls[0][1]).toBe(REPAIR_RETRY_INTERVAL_MS);
    });

    it('re-enqueues itself even when the run throws a systemic failure', async () => {
        const repairNode = jest.fn(async () => {
            throw new SearchLibraryError('wasm exploded', null);
        });
        const populator = populatorWith(repairNode);
        const enqueueDelayed = jest.fn();
        await db.putRepairEntry(seedEntry({ nodeUid: 'node-1' }));

        await expect(
            new RepairFailedNodesTask().execute(
                makeTaskContext({ db, getIndexPopulator: () => populator, enqueueDelayed })
            )
        ).rejects.toThrow('wasm exploded');

        expect(enqueueDelayed).toHaveBeenCalledTimes(1);
        expect(enqueueDelayed.mock.calls[0][1]).toBe(REPAIR_RETRY_INTERVAL_MS);
    });
});
