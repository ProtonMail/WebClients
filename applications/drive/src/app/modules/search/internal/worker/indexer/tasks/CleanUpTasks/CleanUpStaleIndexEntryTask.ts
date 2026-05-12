import type { Entry } from '@proton/proton-foundation-search';

import { Logger } from '../../../../shared/Logger';
import type { IndexPopulatorState } from '../../../../shared/SearchDB';
import { sendErrorReportForSearch } from '../../../../shared/errors';
import { yieldToEventLoop } from '../../../../shared/yieldToEventLoop';
import type { IndexInstance } from '../../../index/IndexRegistry';
import { DEFAULT_BATCH_SIZE, exportEntries, removeDocumentIds } from '../../../index/indexEntriesUtils';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Hand the worker event loop back to pending `postMessage`s (search queries) every
// this many processed entries. The number is low enough to make sure
// the event loop can take over every ~ dozen of ms.
const YIELD_EVENT_LOOP_EVERY = 200;

/**
 * Removes stale entries from every IndexInstance.
 *
 * Policy: an entry is kept iff its (indexPopulatorKind, treeEventScopeId, version,
 * generation) tuple matches a populator state, AND both its populator kind and
 * tree-event-scope id are still in `ctx.activePopulatorKinds` /
 * `ctx.activeTreeEventScopeIds`. Entries are deleted when they:
 *  - come from a previous generation / version,
 *  - have no matching populator state (orphan),
 *  - belong to a populator kind that is no longer active (removed, disabled, unregistered),
 *  - belong to a tree-event-scope that is no longer active (volume unshared, etc.),
 *  - are missing one or more of the core classification attributes (unclassifiable).
 */
export class CleanUpStaleIndexEntryTask extends BaseTask {
    getUid(): string {
        return this.getKind();
    }

    getKind(): IndexerTaskKind {
        return 'cleanup-stale-index-entries-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);

        const allStates = await ctx.db.getAllPopulatorStates();
        const activePopulatorKinds = new Set(ctx.activeIndexPopulators.map((p) => p.indexPopulatorKind));
        const activeTreeEventScopeIds = new Set(ctx.activeIndexPopulators.map((p) => p.treeEventScopeId));

        for (const instance of ctx.indexRegistry.getAll()) {
            try {
                await this.cleanupInstance(
                    instance,
                    allStates,
                    activePopulatorKinds,
                    activeTreeEventScopeIds,
                    ctx.signal
                );
            } catch (e) {
                sendErrorReportForSearch(`${this.getUid()}: failed for engine <${instance.indexKind}>`, e, {
                    tags: { indexKind: instance.indexKind },
                });
                continue;
            }
        }
    }

    private async cleanupInstance(
        instance: IndexInstance,
        allStates: IndexPopulatorState[],
        activePopulatorKinds: Set<string>,
        activeTreeEventScopeIds: Set<string>,
        signal: AbortSignal
    ): Promise<void> {
        // Index states by uid ("populatorKind:treeEventScopeId") for O(1) lookup per exported entry.
        const stateByUid = new Map<string, IndexPopulatorState>();
        for (const state of allStates) {
            stateByUid.set(state.uid, state);
        }

        let totalRemoved = 0;
        let pending: string[] = [];
        const removePendingStaleIndexEntries = async () => {
            if (pending.length === 0) {
                return;
            }
            const ids = pending;
            pending = [];
            totalRemoved += await removeDocumentIds(instance, ids, signal);
        };

        let processedSinceYield = 0;
        for await (const entry of exportEntries(instance, signal)) {
            if (isEntryStale(entry, stateByUid, activePopulatorKinds, activeTreeEventScopeIds)) {
                pending.push(entry.identifier());
            }
            if (pending.length >= DEFAULT_BATCH_SIZE) {
                await removePendingStaleIndexEntries();
                processedSinceYield = 0; // removeDocumentIds already relinquished the thread
                continue;
            }
            if (++processedSinceYield >= YIELD_EVENT_LOOP_EVERY) {
                await yieldToEventLoop();
                processedSinceYield = 0;
            }
        }
        await removePendingStaleIndexEntries();

        if (totalRemoved > 0) {
            Logger.info(`${this.getUid()}: removed ${totalRemoved} stale entries for <${instance.indexKind}>`);
        }
    }
}

function isEntryStale(
    entry: Entry,
    stateByUid: Map<string, IndexPopulatorState>,
    activePopulatorKinds: Set<string>,
    activeTreeEventScopeIds: Set<string>
): boolean {
    const populatorKind = readSearchLibraryTagAttribute(entry, 'indexPopulatorKind');
    const treeEventScopeId = readSearchLibraryTagAttribute(entry, 'treeEventScopeId');
    const version = readSearchLibraryIntegerAttribute(entry, 'indexPopulatorVersion');
    const generation = readSearchLibraryIntegerAttribute(entry, 'indexPopulatorGeneration');

    if (
        populatorKind === undefined ||
        treeEventScopeId === undefined ||
        version === undefined ||
        generation === undefined
    ) {
        // Malformed index entry: we can't classify it, so we mark it as stale.
        Logger.warn(
            `Malformed index entry ${entry.identifier()}: ` +
                `indexPopulatorKind=${populatorKind}, treeEventScopeId=${treeEventScopeId}, ` +
                `indexPopulatorVersion=${version}, indexPopulatorGeneration=${generation}`
        );
        return true;
    }

    const state = stateByUid.get(`${populatorKind}:${treeEventScopeId}`);
    if (!state) {
        // Orphan: no state for this (populatorKind, treeEventScopeId). Mark as stale.
        return true;
    }

    if (!activePopulatorKinds.has(populatorKind)) {
        return true;
    }
    // Remove entries from untracked treeEventScopeId (volume unshared, recovery volume, ...)
    if (!activeTreeEventScopeIds.has(treeEventScopeId)) {
        return true;
    }
    // Remove entries from previous versions or generations.
    return state.version !== version || state.generation !== generation;
}

function readSearchLibraryTagAttribute(entry: Entry, name: string): string | undefined {
    const values = entry.attribute(name);
    let found: string | undefined;
    for (const ev of values) {
        if (found === undefined) {
            const raw = ev.value();
            if (typeof raw === 'string') {
                found = raw;
            }
        }
        ev.free();
    }
    return found;
}

function readSearchLibraryIntegerAttribute(entry: Entry, name: string): number | undefined {
    const values = entry.attribute(name);
    let found: number | undefined;
    for (const ev of values) {
        if (found === undefined) {
            const raw = ev.value();
            // WASM returns integer attributes as plain `number` on export, even though
            // they were written via `Value.int(bigint)`. Values always originate from
            // `BigInt(…)` wrapping a `number` in `createIndexEntry`, so the round-trip
            // to a plain `number` is lossless for our use.
            if (typeof raw === 'number') {
                found = raw;
            } else if (typeof raw === 'bigint') {
                found = Number(raw);
            }
        }
        ev.free();
    }
    return found;
}
