import type { DriveEvent } from '@protontech/drive-sdk';
import * as Comlink from 'comlink';

import type { DriveSdkForSearchBridge } from '../../mainThread/MainThreadBridge';
import type { TreeEventScopeId } from '../../shared/types';

/**
 * Subscribes to tree events for a single TreeEventScopeId and accumulates them in a buffer.
 * Events can be drained for batch processing.
 */
export class TreeEventCollector {
    private buffer: DriveEvent[] = [];

    private constructor(
        private readonly scopeId: TreeEventScopeId,
        private readonly driveSdkForSearch: DriveSdkForSearchBridge
    ) {}

    static async create(
        scopeId: TreeEventScopeId,
        driveSdkForSearch: DriveSdkForSearchBridge
    ): Promise<TreeEventCollector> {
        const collector = new TreeEventCollector(scopeId, driveSdkForSearch);
        await driveSdkForSearch.subscribeToTreeEvents(
            scopeId,
            Comlink.proxy((event) => {
                collector.buffer.push(event);
            })
        );
        return collector;
    }

    private static readonly SIGNAL_EVENT_TYPES: ReadonlySet<string> = new Set([
        'tree_refresh',
        'tree_remove',
        'shared_with_me_updated',
    ]);

    /**
     * Return buffered events up to and including the first signal event, without removing them.
     * Signal events (tree_refresh, tree_remove, shared_with_me_updated) require special handling
     * and should stop the current batch so they are processed before continuing.
     * If no signal event is found, returns all buffered events.
     */
    peekUntilSignalEvent(): DriveEvent[] {
        const signalIndex = this.buffer.findIndex((e) => TreeEventCollector.SIGNAL_EVENT_TYPES.has(e.type));
        if (signalIndex === -1) {
            return this.buffer.slice();
        }
        return this.buffer.slice(0, signalIndex + 1);
    }

    /**
     * Remove the first `count` events from the buffer (the ones returned by a prior peek()).
     */
    commit(count: number): void {
        this.buffer.splice(0, count);
    }

    dispose(): void {
        this.driveSdkForSearch.disposeTreeEventSubscription(this.scopeId);
        this.buffer = [];
    }
}
