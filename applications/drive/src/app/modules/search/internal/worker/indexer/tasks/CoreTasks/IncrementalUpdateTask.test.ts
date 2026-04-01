import type { DriveEvent } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../../../shared/SearchDB';
import { InvalidIndexerState, SearchLibraryError } from '../../../../shared/errors';
import type { TreeEventScopeId } from '../../../../shared/types';
import { FakeMainThreadBridge } from '../../../../testing/FakeMainThreadBridge';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { makeTestPopulator } from '../../../../testing/makeTestPopulator';
import type { IndexPopulatorRegistration } from '../../TreeSubscriptionRegistry';
import { TreeSubscriptionRegistry } from '../../TreeSubscriptionRegistry';
import { IncrementalUpdateTask } from './IncrementalUpdateTask';

jest.mock('../../../../shared/errors', () => ({
    ...jest.requireActual('../../../../shared/errors'),
    sendErrorReportForSearch: jest.fn(),
}));

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeEvent = (eventId: string, type = 'node_created'): DriveEvent => ({ type, eventId }) as unknown as DriveEvent;

async function registerAndGet(
    registry: TreeSubscriptionRegistry,
    populatorId = 'pop-1'
): Promise<{ populator: ReturnType<typeof makeTestPopulator>; registration: IndexPopulatorRegistration }> {
    const populator = makeTestPopulator(populatorId, SCOPE_ID);
    await registry.register(SCOPE_ID, populator, 'evt-0', 0);
    const registration = registry.getRegistration(populator);
    if (!registration) {
        throw new Error('registration not found in test setup');
    }
    return { populator, registration };
}

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

    it('processes events and commits them', async () => {
        const { populator, registration } = await registerAndGet(registry);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));
        bridge.emitEvent(SCOPE_ID, makeEvent('e2'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(registration).execute(ctx);

        expect(populator.processIncrementalUpdates).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ eventId: 'e1' }),
                expect.objectContaining({ eventId: 'e2' }),
            ]),
            ctx
        );

        expect(registration.collector.peek()).toHaveLength(0);
    });

    it('updates lastEventId and subscriptionTime after processing', async () => {
        const { registration } = await registerAndGet(registry);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));
        bridge.emitEvent(SCOPE_ID, makeEvent('e2'));

        jest.useFakeTimers();
        jest.setSystemTime(12345);
        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(registration).execute(ctx);

        expect(registration.lastEventId).toBe('e2');
        expect(registration.subscriptionTime).toBe(12345);
        jest.useRealTimers();
    });

    it('calls markIncrementalUpdateComplete after successful processing', async () => {
        const { registration } = await registerAndGet(registry);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(registration).execute(ctx);

        expect(registration.lastIncrementalUpdateTime).toBeGreaterThan(0);
    });

    it('leaves events in collector and calls markIncrementalUpdateComplete on transient error', async () => {
        const { populator, registration } = await registerAndGet(registry);
        (populator.processIncrementalUpdates as jest.Mock).mockRejectedValue(new Error('boom'));

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(registration).execute(ctx);

        expect(registration.collector.peek()).toHaveLength(1);
        expect(registration.lastIncrementalUpdateTime).toBeGreaterThan(0);
    });

    it('commits only processed events on partial success', async () => {
        const { populator, registration } = await registerAndGet(registry);
        (populator.processIncrementalUpdates as jest.Mock).mockResolvedValue(1);

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));
        bridge.emitEvent(SCOPE_ID, makeEvent('e2'));
        bridge.emitEvent(SCOPE_ID, makeEvent('e3'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(registration).execute(ctx);

        expect(registration.lastEventId).toBe('e1');
        expect(registration.collector.peek()).toHaveLength(2);
        expect(registration.collector.peek()[0].eventId).toBe('e2');
    });

    it('re-throws permanent errors (InvalidIndexerState)', async () => {
        const { populator, registration } = await registerAndGet(registry);
        (populator.processIncrementalUpdates as jest.Mock).mockRejectedValue(
            new InvalidIndexerState('session already released')
        );

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });

        await expect(new IncrementalUpdateTask(registration).execute(ctx)).rejects.toThrow(InvalidIndexerState);
    });

    it('re-throws permanent errors (QuotaExceededError)', async () => {
        const { populator, registration } = await registerAndGet(registry);
        (populator.processIncrementalUpdates as jest.Mock).mockRejectedValue(
            new DOMException('', 'QuotaExceededError')
        );

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });

        await expect(new IncrementalUpdateTask(registration).execute(ctx)).rejects.toThrow(DOMException);
    });

    it('re-throws permanent errors (SearchLibraryError)', async () => {
        const { populator, registration } = await registerAndGet(registry);
        (populator.processIncrementalUpdates as jest.Mock).mockRejectedValue(
            new SearchLibraryError('WASM failed', new Error('cause'))
        );

        bridge.emitEvent(SCOPE_ID, makeEvent('e1'));

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });

        await expect(new IncrementalUpdateTask(registration).execute(ctx)).rejects.toThrow(SearchLibraryError);
    });

    it('does not call processIncrementalUpdates when collector has no events', async () => {
        const { populator, registration } = await registerAndGet(registry);

        const ctx = makeTaskContext({ treeSubscriptionRegistry: registry });
        await new IncrementalUpdateTask(registration).execute(ctx);

        expect(populator.processIncrementalUpdates).not.toHaveBeenCalled();
    });
});
