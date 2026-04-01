import type { DriveEvent } from '@protontech/drive-sdk';

import { TreeEventCollector } from './TreeEventCollector';

const makeEvent = (type: string, eventId = 'evt-1'): DriveEvent => ({ type, eventId }) as unknown as DriveEvent;

describe('TreeEventCollector', () => {
    let collector: TreeEventCollector;

    beforeEach(() => {
        collector = new TreeEventCollector();
    });

    describe('push + peek', () => {
        it('returns all buffered events', () => {
            collector.push(makeEvent('node_created', 'e1'));
            collector.push(makeEvent('node_updated', 'e2'));
            collector.push(makeEvent('node_deleted', 'e3'));

            const result = collector.peek();
            expect(result).toHaveLength(3);
        });

        it('returns empty array when buffer is empty', () => {
            expect(collector.peek()).toHaveLength(0);
        });

        it('is idempotent (does not consume events)', () => {
            collector.push(makeEvent('node_created', 'e1'));
            collector.push(makeEvent('node_updated', 'e2'));

            const first = collector.peek();
            const second = collector.peek();
            expect(first).toEqual(second);
        });
    });

    describe('commit', () => {
        it('removes the first N events from the buffer', () => {
            collector.push(makeEvent('node_created', 'e1'));
            collector.push(makeEvent('node_updated', 'e2'));
            collector.push(makeEvent('node_deleted', 'e3'));
            collector.push(makeEvent('node_moved', 'e4'));

            collector.commit(2);
            const remaining = collector.peek();
            expect(remaining).toHaveLength(2);
            expect(remaining[0].eventId).toBe('e3');
            expect(remaining[1].eventId).toBe('e4');
        });

        it('commit(0) is a no-op', () => {
            collector.push(makeEvent('node_created', 'e1'));
            collector.push(makeEvent('node_updated', 'e2'));
            collector.commit(0);
            expect(collector.peek()).toHaveLength(2);
        });
    });

    describe('dispose', () => {
        it('clears the buffer', () => {
            collector.push(makeEvent('node_created', 'e1'));
            collector.dispose();
            expect(collector.peek()).toHaveLength(0);
        });
    });
});
