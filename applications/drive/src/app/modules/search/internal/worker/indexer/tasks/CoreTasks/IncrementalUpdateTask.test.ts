import type { DriveEvent } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../../shared/types';
import { FakeMainThreadBridge } from '../../../../testing/FakeMainThreadBridge';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { makeTestPopulator } from '../../../../testing/makeTestPopulator';
import { TreeSubscriptionRegistry } from '../../TreeSubscriptionRegistry';
import { IncrementalUpdateTask } from './IncrementalUpdateTask';

jest.mock('../../../../shared/errors', () => ({
    sendErrorReportForSearch: jest.fn(),
}));

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeEvent = (eventId: string, type = 'node_created'): DriveEvent => ({ type, eventId }) as unknown as DriveEvent;

describe('IncrementalUpdateTask', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let registry: TreeSubscriptionRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        registry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
    });

    it('self-schedules when no registration exists', async () => {
        const populator = makeTestPopulator();
        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });

        await new IncrementalUpdateTask(populator).execute(ctx);

        expect(ctx.enqueueDelayed).toHaveBeenCalledWith(expect.any(IncrementalUpdateTask), 60_000);
    });

    it('processes events and commits them', async () => {
        const populator = makeTestPopulator('pop-1', SCOPE_ID);
        await registry.register(SCOPE_ID, populator, 'evt-0', 0 /* subscriptionTime */);

        // Push events through the real bridge → collector pipeline
        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));
        bridge.emitEvent(SCOPE_ID, makeEvent('e2'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(populator).execute(ctx);

        expect(populator.processIncrementalUpdates).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ eventId: 'e1' }),
                expect.objectContaining({ eventId: 'e2' }),
            ]),
            ctx
        );

        // Events are committed — collector should be empty now
        const reg = registry.getRegistration(populator);
        expect(reg?.collector.peekUntilSignalEvent()).toHaveLength(0);
    });

    it('updates lastEventId and subscriptionTime after processing', async () => {
        const populator = makeTestPopulator('pop-1', SCOPE_ID);
        await registry.register(SCOPE_ID, populator, 'evt-0', 0 /* subscriptionTime */);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));
        bridge.emitEvent(SCOPE_ID, makeEvent('e2'));

        jest.useFakeTimers();
        jest.setSystemTime(12345);
        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(populator).execute(ctx);

        const reg = registry.getRegistration(populator);
        expect(reg?.lastEventId).toBe('e2');
        expect(reg?.subscriptionTime).toBe(12345);
        jest.useRealTimers();
    });

    it('self-schedules after successful processing', async () => {
        const populator = makeTestPopulator('pop-1', SCOPE_ID);
        await registry.register(SCOPE_ID, populator, 'evt-0', 0);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(populator).execute(ctx);

        expect(ctx.enqueueDelayed).toHaveBeenCalledWith(expect.any(IncrementalUpdateTask), 60_000);
    });

    it('does not commit events when processIncrementalUpdates throws', async () => {
        const populator = makeTestPopulator('pop-1', SCOPE_ID);
        (populator.processIncrementalUpdates as jest.Mock).mockRejectedValue(new Error('boom'));
        await registry.register(SCOPE_ID, populator, 'evt-0', 0 /* subscriptionTime */);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(populator).execute(ctx);

        // Events remain in the collector for retry
        const reg = registry.getRegistration(populator);
        expect(reg?.collector.peekUntilSignalEvent()).toHaveLength(1);

        expect(ctx.enqueueDelayed).toHaveBeenCalledWith(expect.any(IncrementalUpdateTask), 60_000);
    });

    it('self-schedules even after error', async () => {
        const populator = makeTestPopulator('pop-1', SCOPE_ID);
        (populator.processIncrementalUpdates as jest.Mock).mockRejectedValue(new Error('boom'));
        await registry.register(SCOPE_ID, populator, 'evt-0', 0 /* subscriptionTime */);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(populator).execute(ctx);

        expect(ctx.enqueueDelayed).toHaveBeenCalledWith(expect.any(IncrementalUpdateTask), 60_000);
    });

    it('does nothing when collector has no events', async () => {
        const populator = makeTestPopulator('pop-1', SCOPE_ID);
        await registry.register(SCOPE_ID, populator, 'evt-0', 0 /* subscriptionTime */);

        // No events emitted

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(populator).execute(ctx);

        expect(populator.processIncrementalUpdates).not.toHaveBeenCalled();
        expect(ctx.enqueueDelayed).toHaveBeenCalledWith(expect.any(IncrementalUpdateTask), 60_000);
    });
});
