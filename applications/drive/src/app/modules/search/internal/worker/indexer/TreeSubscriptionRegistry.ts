import * as Comlink from 'comlink';

import type { MainThreadBridge } from '../../mainThread/MainThreadBridge';
import type { SearchDB } from '../../shared/SearchDB';
import type { TreeEventScopeId } from '../../shared/types';
import { TreeEventCollector } from './TreeEventCollector';
import type { IndexPopulator } from './indexPopulators/IndexPopulator';

// Delay before starting an incremental update task: allows batching when receiving
// a burst of events (they arrive one by one), instead of starting immediately.
const INCREMENTAL_UPDATE_DEBOUNCE_MS = 5_000;

// Minimum interval between two incremental updates for a given tree event scope.
const INCREMENTAL_UPDATE_MIN_INTERVAL_MS = 60_000;

export interface IndexPopulatorRegistration {
    populator: IndexPopulator;
    collector: TreeEventCollector;
    lastEventId: string;
    subscriptionTime: number;
    lastIncrementalUpdateTime: number;
    pendingIncrementalUpdateTimeout: ReturnType<typeof setTimeout> | null;
}

export interface TreeEventScopeEntry {
    registrations: IndexPopulatorRegistration[];
}

/**
 * Tracks registered IndexPopulators grouped by TreeEventScopeId.
 *
 * Scope-level concerns (SDK cursor, subscription persistence) happen once per scope.
 * Per-populator concerns (collector, event cursor) live on each registration.
 *
 * The registry owns the SDK event subscription: it pushes events into each
 * registration's collector and debounce-schedules incremental update tasks.
 */
export class TreeSubscriptionRegistry {
    private readonly entries = new Map<TreeEventScopeId, TreeEventScopeEntry>();
    private scheduleFn: ((registration: IndexPopulatorRegistration) => void) | null = null;

    private constructor(
        private readonly bridge: MainThreadBridge,
        private readonly db: SearchDB
    ) {}

    static async create(bridge: MainThreadBridge, db: SearchDB): Promise<TreeSubscriptionRegistry> {
        const registry = new TreeSubscriptionRegistry(bridge, db);

        // Restore persisted subscriptions so the SDK starts buffering events
        // from the last known cursor on reload.
        const subscriptions = await db.getAllSubscriptions();
        for (const sub of subscriptions) {
            bridge.updateLatestEventId(sub.treeEventScopeId, sub.lastEventId);
        }

        return registry;
    }

    /**
     * Wire the registry to the task queue so it can schedule incremental updates.
     * Called once after bootstrap completes. Immediately kicks scheduling for any
     * registrations that already have buffered events (accumulated during bootstrap).
     */
    startIncrementalUpdateScheduling(fn: (registration: IndexPopulatorRegistration) => void): void {
        this.scheduleFn = fn;
        for (const reg of this.getAllRegistrations()) {
            if (reg.collector.peek().length > 0) {
                this.scheduleIncrementalUpdate(reg);
            }
        }
    }

    async register(
        treeEventScopeId: TreeEventScopeId,
        populator: IndexPopulator,
        lastEventId: string,
        subscriptionTime: number
    ): Promise<void> {
        let entry = this.entries.get(treeEventScopeId);

        if (!entry) {
            // First registration for this scope — initialize SDK cursor and persist.
            this.bridge.updateLatestEventId(treeEventScopeId, lastEventId);
            await this.db.putSubscription({
                treeEventScopeId,
                lastEventId,
                lastEventIdTime: subscriptionTime,
            });
            entry = { registrations: [] };
            this.entries.set(treeEventScopeId, entry);
        }

        // Skip if this populator is already registered.
        if (entry.registrations.some((r) => r.populator.getUid() === populator.getUid())) {
            return;
        }

        const collector = new TreeEventCollector();
        const registration: IndexPopulatorRegistration = {
            populator,
            collector,
            lastEventId,
            subscriptionTime,
            lastIncrementalUpdateTime: 0,
            pendingIncrementalUpdateTimeout: null,
        };

        // Registry owns the subscription: push into buffer + schedule.
        await this.bridge.driveSdkForSearch.subscribeToTreeEvents(
            treeEventScopeId,
            Comlink.proxy((event) => {
                collector.push(event);
                this.scheduleIncrementalUpdate(registration);
            })
        );

        entry.registrations.push(registration);
    }

    getRegistration(populator: IndexPopulator): IndexPopulatorRegistration | undefined {
        for (const entry of this.entries.values()) {
            const reg = entry.registrations.find((r) => r.populator.getUid() === populator.getUid());
            if (reg) {
                return reg;
            }
        }
        return undefined;
    }

    getAllRegistrations(): IndexPopulatorRegistration[] {
        return [...this.entries.values()].flatMap((entry) => entry.registrations);
    }

    getAll(): ReadonlyMap<TreeEventScopeId, TreeEventScopeEntry> {
        return this.entries;
    }

    /**
     * Called by IncrementalUpdateTask after processing.
     * Re-schedules if events remain (partial commit or transient error).
     */
    markIncrementalUpdateComplete(registration: IndexPopulatorRegistration): void {
        registration.lastIncrementalUpdateTime = Date.now();
        if (registration.collector.peek().length > 0) {
            this.scheduleIncrementalUpdate(registration);
        }
    }

    unregisterByScope(treeEventScopeId: TreeEventScopeId): void {
        const entry = this.entries.get(treeEventScopeId);
        if (entry) {
            for (const reg of entry.registrations) {
                if (reg.pendingIncrementalUpdateTimeout) {
                    clearTimeout(reg.pendingIncrementalUpdateTimeout);
                }
                reg.collector.dispose();
            }
            this.bridge.driveSdkForSearch.disposeTreeEventSubscription(treeEventScopeId);
            this.entries.delete(treeEventScopeId);
        }
    }

    dispose(): void {
        for (const [scopeId, entry] of this.entries) {
            for (const reg of entry.registrations) {
                if (reg.pendingIncrementalUpdateTimeout) {
                    clearTimeout(reg.pendingIncrementalUpdateTimeout);
                }
                reg.collector.dispose();
            }
            this.bridge.driveSdkForSearch.disposeTreeEventSubscription(scopeId);
        }
        this.entries.clear();
    }

    private scheduleIncrementalUpdate(registration: IndexPopulatorRegistration): void {
        if (!this.scheduleFn || registration.pendingIncrementalUpdateTimeout) {
            return;
        }

        const elapsed = Date.now() - registration.lastIncrementalUpdateTime;
        const delay = Math.max(INCREMENTAL_UPDATE_DEBOUNCE_MS, INCREMENTAL_UPDATE_MIN_INTERVAL_MS - elapsed);

        registration.pendingIncrementalUpdateTimeout = setTimeout(() => {
            registration.pendingIncrementalUpdateTimeout = null;
            this.scheduleFn?.(registration);
        }, delay);
    }
}
