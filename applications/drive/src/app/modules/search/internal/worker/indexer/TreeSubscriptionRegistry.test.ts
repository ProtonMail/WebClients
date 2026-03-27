import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../shared/SearchDB';
import type { TreeEventScopeId } from '../../shared/types';
import { FakeMainThreadBridge } from '../../testing/FakeMainThreadBridge';
import { makeTestPopulator } from '../../testing/makeTestPopulator';
import { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';

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
