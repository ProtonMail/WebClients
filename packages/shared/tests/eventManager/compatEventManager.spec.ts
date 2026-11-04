import createCompatEventManager from '../../lib/eventManager/compatEventManager';
import type { EventManager } from '../../lib/eventManager/eventManager';

const createMockEventManager = ({ withIntervalsOverride = true } = {}) => {
    const eventManager = {
        setEventID: vi.fn(),
        getEventID: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        call: vi.fn(async () => {}),
        reset: vi.fn(),
        subscribe: vi.fn(() => () => {}),
        setIntervalsOverride: withIntervalsOverride ? vi.fn() : undefined,
    };
    return eventManager satisfies EventManager<any>;
};

describe('compat event manager', () => {
    it('forwards start, stop and reset to every event manager', () => {
        const eventManagers = [createMockEventManager(), createMockEventManager()];
        const compat = createCompatEventManager({ eventManagers });

        compat.start();
        compat.stop();
        compat.reset();

        eventManagers.forEach((eventManager) => {
            expect(eventManager.start).toHaveBeenCalledTimes(1);
            expect(eventManager.stop).toHaveBeenCalledTimes(1);
            expect(eventManager.reset).toHaveBeenCalledTimes(1);
        });
    });

    it('forwards call with its trigger to every event manager and waits for all of them', async () => {
        let resolveSlow!: () => void;
        const fast = createMockEventManager();
        const slow = createMockEventManager();
        slow.call.mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveSlow = resolve;
                })
        );
        const compat = createCompatEventManager({ eventManagers: [fast, slow] });

        let settled = false;
        const promise = compat.call('Ping').then(() => {
            settled = true;
        });
        await Promise.resolve();

        expect(fast.call).toHaveBeenCalledWith('Ping');
        expect(slow.call).toHaveBeenCalledWith('Ping');
        expect(settled).toBe(false);

        resolveSlow();
        await promise;
        expect(settled).toBe(true);
    });

    it('forwards the intervals override to every event manager supporting it', () => {
        const supporting = createMockEventManager();
        const unsupporting = createMockEventManager({ withIntervalsOverride: false });
        const compat = createCompatEventManager({ eventManagers: [supporting, unsupporting] });
        const intervals = { foreground: 120_000, background: 300_000 };

        expect(() => compat.setIntervalsOverride?.(intervals)).not.toThrow();
        expect(supporting.setIntervalsOverride).toHaveBeenLastCalledWith(intervals);

        compat.setIntervalsOverride?.(undefined);
        expect(supporting.setIntervalsOverride).toHaveBeenLastCalledWith(undefined);
    });

    it('does not support subscribing nor the event ID', () => {
        const eventManager = createMockEventManager();
        const compat = createCompatEventManager({ eventManagers: [eventManager] });
        const listener = vi.fn();

        compat.subscribe(listener)();
        compat.setEventID('1');

        expect(eventManager.subscribe).not.toHaveBeenCalled();
        expect(eventManager.setEventID).not.toHaveBeenCalled();
        expect(compat.getEventID()).toBe('');
    });
});
