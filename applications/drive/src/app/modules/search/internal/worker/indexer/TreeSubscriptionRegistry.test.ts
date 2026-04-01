import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../shared/SearchDB';
import type { TreeEventScopeId } from '../../shared/types';
import { FakeMainThreadBridge } from '../../testing/FakeMainThreadBridge';
import { makeTestPopulator } from '../../testing/makeTestPopulator';
import type { IndexPopulatorRegistration } from './TreeSubscriptionRegistry';
import { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';
import { IndexPopulator } from './indexPopulators/IndexPopulator';

const SCOPE_1 = 'scope-1' as TreeEventScopeId;
const SCOPE_2 = 'scope-2' as TreeEventScopeId;

describe('TreeSubscriptionRegistry integration', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
    });

    it('create() restores persisted subscriptions and calls updateLatestEventId', async () => {
        await db.putSubscription({ treeEventScopeId: SCOPE_1, lastEventId: 'evt-5', lastEventIdTime: 1000 });
        await db.putSubscription({ treeEventScopeId: SCOPE_2, lastEventId: 'evt-10', lastEventIdTime: 2000 });

        await TreeSubscriptionRegistry.create(bridge.asBridge(), db);

        expect(bridge.saveLatestEventIdCalls).toEqual(
            expect.arrayContaining([
                [SCOPE_1, 'evt-5'],
                [SCOPE_2, 'evt-10'],
            ])
        );
    });

    it('register() creates entry and collector for new scope', async () => {
        const registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
        const populator = makeTestPopulator('pop-1');

        await registry.register(SCOPE_1, populator, 'evt-1', 1000);

        const reg = registry.getRegistration(populator);
        expect(reg).toBeDefined();
        expect(reg?.lastEventId).toBe('evt-1');
    });

    it('register() deduplicates by populator UID', async () => {
        const registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
        const populator = makeTestPopulator('pop-1');

        await registry.register(SCOPE_1, populator, 'evt-1', 1000);
        await registry.register(SCOPE_1, populator, 'evt-2', 2000);

        expect(registry.getAllRegistrations()).toHaveLength(1);
        expect(registry.getRegistration(populator)).toBeDefined();
        // First registration's event ID is kept
        expect(registry.getRegistration(populator)?.lastEventId).toBe('evt-1');
    });

    it('register() allows multiple populators under same scope', async () => {
        const registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
        const pop1 = makeTestPopulator('pop-1');
        const pop2 = makeTestPopulator('pop-2');

        await registry.register(SCOPE_1, pop1, 'evt-1', 1000);
        await registry.register(SCOPE_1, pop2, 'evt-1', 1000);

        expect(registry.getAllRegistrations()).toHaveLength(2);
    });

    it('getAllRegistrations() returns all registrations across scopes', async () => {
        const registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);

        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-1', 1000);
        await registry.register(SCOPE_2, makeTestPopulator('pop-2', SCOPE_2), 'evt-2', 2000);
        await registry.register(SCOPE_1, makeTestPopulator('pop-3', SCOPE_1), 'evt-3', 3000);

        expect(registry.getAllRegistrations()).toHaveLength(3);
    });

    it('getAll() returns map keyed by scope', async () => {
        const registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);

        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-1', 1000);
        await registry.register(SCOPE_2, makeTestPopulator('pop-2', SCOPE_2), 'evt-2', 2000);

        const all = registry.getAll();
        expect(all.size).toBe(2);
        expect(all.has(SCOPE_1)).toBe(true);
        expect(all.has(SCOPE_2)).toBe(true);
    });

    it('unregisterByScope() removes entry and disposes collectors', async () => {
        const registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
        const populator = makeTestPopulator('pop-1');

        await registry.register(SCOPE_1, populator, 'evt-1', 1000);
        registry.unregisterByScope(SCOPE_1);

        expect(registry.getRegistration(populator)).toBeUndefined();
        expect(bridge.wasDisposed(SCOPE_1)).toBe(true);
    });

    it('dispose() clears everything', async () => {
        const registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);

        await registry.register(SCOPE_1, makeTestPopulator('pop-1'), 'evt-1', 1000);
        await registry.register(SCOPE_2, makeTestPopulator('pop-2', SCOPE_2), 'evt-2', 2000);

        registry.dispose();

        expect(registry.getAllRegistrations()).toHaveLength(0);
    });
});

describe('TreeSubscriptionRegistry scheduling', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let registry: TreeSubscriptionRegistry;
    let scheduled: IndexPopulatorRegistration[];

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
        scheduled = [];
        jest.useFakeTimers();
    });

    afterEach(() => {
        registry.dispose();
        jest.useRealTimers();
    });

    const activate = () => {
        registry.startIncrementalUpdateScheduling((reg) => scheduled.push(reg));
    };

    it('schedules after debounce when an event arrives', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);
        activate();

        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);

        expect(scheduled).toHaveLength(0);
        jest.advanceTimersByTime(5_000);
        expect(scheduled).toHaveLength(1);
    });

    it('debounces a burst of events into a single schedule', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);
        activate();

        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e2' } as any);
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e3' } as any);

        jest.advanceTimersByTime(5_000);
        expect(scheduled).toHaveLength(1);
    });

    it('enforces minimum interval between runs', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);
        activate();

        // First event: schedules after 5s debounce (lastIncrementalUpdateTime is 0, so elapsed > 60s).
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);
        jest.advanceTimersByTime(5_000);
        expect(scheduled).toHaveLength(1);

        // Simulate task completion at current time.
        registry.markIncrementalUpdateComplete(scheduled[0]);

        // Second event arrives immediately after — should wait ~60s, not 5s.
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e2' } as any);

        jest.advanceTimersByTime(5_000);
        expect(scheduled).toHaveLength(1); // Still 1 — not yet scheduled.

        jest.advanceTimersByTime(55_000);
        expect(scheduled).toHaveLength(2); // Now scheduled after 60s.
    });

    it('schedules independently per scope', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);
        await registry.register(SCOPE_2, makeTestPopulator('pop-2', SCOPE_2), 'evt-0', 0);
        activate();

        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);
        bridge.emitEvent(SCOPE_2, { type: 'node_created', eventId: 'e2' } as any);

        jest.advanceTimersByTime(5_000);
        expect(scheduled).toHaveLength(2);

        const scheduledUids = scheduled.map((r) => r.populator.getUid());
        expect(scheduledUids).toContain(IndexPopulator.buildUid('pop-1', SCOPE_1));
        expect(scheduledUids).toContain(IndexPopulator.buildUid('pop-2', SCOPE_2));
    });

    it('does not schedule before startIncrementalUpdateScheduling is called', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);

        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);
        jest.advanceTimersByTime(60_000);

        expect(scheduled).toHaveLength(0);
    });

    it('accumulates events before activation and processes them all on first schedule', async () => {
        const populator = makeTestPopulator('pop-1', SCOPE_1);
        await registry.register(SCOPE_1, populator, 'evt-0', 0);

        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e2' } as any);
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e3' } as any);

        // Events buffered but no scheduling yet.
        jest.advanceTimersByTime(60_000);
        expect(scheduled).toHaveLength(0);

        const reg = registry.getRegistration(populator);
        expect(reg?.collector.peek()).toHaveLength(3);

        // Activation flushes — all 3 events available for the scheduled task.
        activate();
        jest.advanceTimersByTime(5_000);

        expect(scheduled).toHaveLength(1);
        expect(scheduled[0].collector.peek()).toHaveLength(3);
    });

    it('flushes buffered events when startIncrementalUpdateScheduling is called', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);

        // Events arrive before activation.
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);

        activate();
        jest.advanceTimersByTime(5_000);

        expect(scheduled).toHaveLength(1);
    });

    it('re-schedules after markIncrementalUpdateComplete if events remain', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);
        activate();

        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);
        jest.advanceTimersByTime(5_000);
        expect(scheduled).toHaveLength(1);

        // Simulate: task ran but events remain (partial commit).
        // Push another event to simulate leftover.
        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e2' } as any);
        registry.markIncrementalUpdateComplete(scheduled[0]);

        // Should re-schedule after min interval.
        jest.advanceTimersByTime(60_000);
        expect(scheduled).toHaveLength(2);
    });

    it('dispose clears pending scheduling timeouts', async () => {
        await registry.register(SCOPE_1, makeTestPopulator('pop-1', SCOPE_1), 'evt-0', 0);
        activate();

        bridge.emitEvent(SCOPE_1, { type: 'node_created', eventId: 'e1' } as any);

        registry.dispose();
        jest.advanceTimersByTime(60_000);

        expect(scheduled).toHaveLength(0);
    });
});
