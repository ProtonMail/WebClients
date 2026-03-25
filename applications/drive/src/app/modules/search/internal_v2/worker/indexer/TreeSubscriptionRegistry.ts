import type { MainThreadBridge } from '../../mainThread/MainThreadBridge';
import type { SearchDB } from '../../shared/SearchDB';
import type { TreeEventScopeId } from '../../shared/types';
import { TreeEventCollector } from './TreeEventCollector';
import type { IndexPopulator } from './indexPopulators/IndexPopulator';

export interface IndexPopulatorRegistration {
    populator: IndexPopulator;
    collector: TreeEventCollector;
    lastEventId: string;
    subscriptionTime: number;
}

export interface TreeEventScopeEntry {
    registrations: IndexPopulatorRegistration[];
}

/**
 * Tracks registered IndexPopulators grouped by TreeEventScopeId.
 *
 * Scope-level concerns (SDK cursor, subscription persistence) happen once per scope.
 * Per-populator concerns (collector, event cursor) live on each registration.
 */
export class TreeSubscriptionRegistry {
    private readonly entries = new Map<TreeEventScopeId, TreeEventScopeEntry>();

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

        const collector = await TreeEventCollector.create(treeEventScopeId, this.bridge.driveSdkForSearch);
        entry.registrations.push({ populator, collector, lastEventId, subscriptionTime });
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

    unregisterByScope(treeEventScopeId: TreeEventScopeId): void {
        const entry = this.entries.get(treeEventScopeId);
        if (entry) {
            for (const reg of entry.registrations) {
                reg.collector.dispose();
            }
            this.entries.delete(treeEventScopeId);
        }
    }

    dispose(): void {
        for (const entry of this.entries.values()) {
            for (const reg of entry.registrations) {
                reg.collector.dispose();
            }
        }
        this.entries.clear();
    }
}
