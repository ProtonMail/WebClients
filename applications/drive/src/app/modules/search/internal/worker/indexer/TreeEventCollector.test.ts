import type { DriveEvent } from '@protontech/drive-sdk';

import type { TreeEventScopeId } from '../../shared/types';
import { TreeEventCollector } from './TreeEventCollector';

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeEvent = (type: string, eventId = 'evt-1'): DriveEvent => ({ type, eventId }) as unknown as DriveEvent;

describe('TreeEventCollector', () => {
    let collector: TreeEventCollector;
    let onEvent: (event: DriveEvent) => void;
    const mockDispose = jest.fn();

    beforeEach(async () => {
        mockDispose.mockClear();
        const fakeBridge = {
            subscribeToTreeEvents: jest.fn(async (_scopeId: string, callback: (event: DriveEvent) => void) => {
                onEvent = callback;
            }),
            disposeTreeEventSubscription: mockDispose,
        };
        collector = await TreeEventCollector.create(SCOPE_ID, fakeBridge as any);
    });

    describe('peekUntilSignalEvent', () => {
        it('returns all events when no signal event is present', () => {
            onEvent(makeEvent('node_created', 'e1'));
            onEvent(makeEvent('node_updated', 'e2'));
            onEvent(makeEvent('node_deleted', 'e3'));

            const result = collector.peekUntilSignalEvent();
            expect(result).toHaveLength(3);
        });

        it('stops at tree_refresh (inclusive)', () => {
            onEvent(makeEvent('node_created', 'e1'));
            onEvent(makeEvent('tree_refresh', 'e2'));
            onEvent(makeEvent('node_updated', 'e3'));

            const result = collector.peekUntilSignalEvent();
            expect(result).toHaveLength(2);
            expect(result[1].type).toBe('tree_refresh');
        });

        it('stops at tree_remove (inclusive)', () => {
            onEvent(makeEvent('node_created', 'e1'));
            onEvent(makeEvent('tree_remove', 'e2'));
            onEvent(makeEvent('node_updated', 'e3'));

            const result = collector.peekUntilSignalEvent();
            expect(result).toHaveLength(2);
            expect(result[1].type).toBe('tree_remove');
        });

        it('stops at shared_with_me_updated (inclusive)', () => {
            onEvent(makeEvent('shared_with_me_updated', 'e1'));
            onEvent(makeEvent('node_updated', 'e2'));

            const result = collector.peekUntilSignalEvent();
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('shared_with_me_updated');
        });

        it('returns empty array when buffer is empty', () => {
            expect(collector.peekUntilSignalEvent()).toHaveLength(0);
        });

        it('is idempotent (does not consume events)', () => {
            onEvent(makeEvent('node_created', 'e1'));
            onEvent(makeEvent('node_updated', 'e2'));

            const first = collector.peekUntilSignalEvent();
            const second = collector.peekUntilSignalEvent();
            expect(first).toEqual(second);
        });
    });

    describe('commit', () => {
        it('removes the first N events from the buffer', () => {
            onEvent(makeEvent('node_created', 'e1'));
            onEvent(makeEvent('node_updated', 'e2'));
            onEvent(makeEvent('node_deleted', 'e3'));
            onEvent(makeEvent('node_moved', 'e4'));

            collector.commit(2);
            const remaining = collector.peekUntilSignalEvent();
            expect(remaining).toHaveLength(2);
            expect(remaining[0].eventId).toBe('e3');
            expect(remaining[1].eventId).toBe('e4');
        });

        it('commit(0) is a no-op', () => {
            onEvent(makeEvent('node_created', 'e1'));
            onEvent(makeEvent('node_updated', 'e2'));
            collector.commit(0);
            expect(collector.peekUntilSignalEvent()).toHaveLength(2);
        });
    });

    describe('dispose', () => {
        it('calls disposeTreeEventSubscription on the bridge', () => {
            collector.dispose();
            expect(mockDispose).toHaveBeenCalledWith(SCOPE_ID);
        });
    });
});
