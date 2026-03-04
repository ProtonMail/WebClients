import type { TimeoutIntervalsState } from '../../lib/eventManager/TimeoutIntervalsState';
import type { VisibilityState } from '../../lib/eventManager/VisibilityState';
import createEventManager from '../../lib/eventManager/eventManager';
import type { EventManagerIntervalTypes, EventManagerIntervals } from '../../lib/eventManager/eventManagerIntervals';

const mockApi = (responses: any) => {
    let i = 0;
    const cb = async () => {
        const response = responses[i++];
        if (response instanceof Error) {
            throw response;
        }
        return response;
    };
    return jasmine.createSpy('mockApi').and.callFake(cb);
};

// Flush enough microtask queues to let all awaits inside call() resolve
// (initialEventIDPromise, getEvents, Promise.all listeners, onceWithQueue cleanup)
const flushPromises = async () => {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
    }
};

const createMockVisibilityState = (initialVisible = true) => {
    const callbacks: ((visible: boolean) => void)[] = [];
    const state = {
        visible: initialVisible,
        subscribe: jasmine.createSpy('subscribe').and.callFake((cb: (visible: boolean) => void) => {
            callbacks.push(cb);
            return () => {
                const index = callbacks.indexOf(cb);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            };
        }),
        triggerChange: (visible: boolean) => {
            state.visible = visible;
            callbacks.forEach((cb) => cb(visible));
        },
    };
    return state as unknown as VisibilityState & { triggerChange: typeof state.triggerChange };
};

const createMockTimeoutIntervalsState = (initialIntervals: EventManagerIntervals) => {
    let intervals = { ...initialIntervals };
    const state = {
        subscribe: jasmine.createSpy('subscribe').and.callFake(() => () => {}),
        getInterval: jasmine.createSpy('getInterval').and.callFake((type: EventManagerIntervalTypes) => {
            return intervals[type];
        }),
        isForegroundEqualToBackground: jasmine
            .createSpy('isForegroundEqualToBackground')
            .and.callFake(() => intervals.foreground === intervals.background),
        setIntervals: (newIntervals: EventManagerIntervals) => {
            intervals = { ...newIntervals };
        },
    };
    return state as unknown as TimeoutIntervalsState & { setIntervals: typeof state.setIntervals };
};

/**
 * TODO: More tests when https://stackoverflow.com/a/50785284 exists
 */
describe('event manager', () => {
    it('should call more and not finish until it is done', async () => {
        const getEvents = mockApi([
            { EventID: '1', More: 1 },
            { EventID: '2', More: 1 },
            { EventID: '3', More: 1 },
            { EventID: '4', More: 1 },
            { EventID: '5', More: 1 },
            { EventID: '6', More: 0 },
            { EventID: '6', More: 0 },
        ]);

        const eventManager = createEventManager({
            eventID: '1',
            getEvents,
            timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 1000, background: 1000 }),
        });
        const onSuccess = jasmine.createSpy();
        const unsubscribe = eventManager.subscribe(onSuccess);

        eventManager.start();

        await eventManager.call();

        expect(getEvents).toHaveBeenCalledTimes(6);
        expect(onSuccess).toHaveBeenCalledTimes(6);

        await eventManager.call();

        expect(getEvents).toHaveBeenCalledTimes(7);
        expect(onSuccess).toHaveBeenCalledTimes(7);

        unsubscribe();
        eventManager.reset();
    });

    it('should call getLatestEventID to get the event ID when it is not passed', async () => {
        const getEvents = mockApi([
            { EventID: '2', More: 0 },
            { EventID: '3', More: 0 },
        ]);
        const getLatestEventID = jasmine.createSpy('getLatestEventID').and.callFake(() => '1');

        const eventManager = createEventManager({
            getLatestEventID,
            getEvents,
            timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 1000, background: 1000 }),
        });
        const onSuccess = jasmine.createSpy();
        const unsubscribe = eventManager.subscribe(onSuccess);

        // Should make one call initially
        expect(getLatestEventID).toHaveBeenCalledTimes(1);

        eventManager.start();

        // Should wait for that call to finish
        await eventManager.call();

        expect(getLatestEventID).toHaveBeenCalledTimes(1);
        expect(getEvents).toHaveBeenCalledTimes(1);

        await eventManager.call();

        expect(getLatestEventID).toHaveBeenCalledTimes(1);
        expect(getEvents).toHaveBeenCalledTimes(2);

        unsubscribe();
        eventManager.reset();
    });

    describe('visibility state rescheduling', () => {
        beforeEach(() => {
            jasmine.clock().install();
            jasmine.clock().mockDate(new Date(0));
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('does not reschedule when the event loop is not started', async () => {
            const visibilityState = createMockVisibilityState(false);
            const getEvents = mockApi([{ EventID: '2', More: 0 }]);

            createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 5_000, background: 30_000 }),
                visibilityState,
            });

            // Trigger visibility change without ever calling start()
            visibilityState.triggerChange(true);

            jasmine.clock().tick(30_000);
            await flushPromises();

            expect(getEvents).not.toHaveBeenCalled();
        });

        it('does not reschedule when the page becomes hidden', async () => {
            const visibilityState = createMockVisibilityState(true);
            const getEvents = mockApi([
                { EventID: '2', More: 0 },
                { EventID: '3', More: 0 },
            ]);

            const eventManager = createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 5_000, background: 30_000 }),
                visibilityState,
            });

            // Complete first call; start() inside schedules next at t=5000 (foreground, page is visible)
            eventManager.start();

            // Hiding the page must not shift the already-scheduled timeout
            visibilityState.triggerChange(false);

            jasmine.clock().tick(4_999); // t=4999, original schedule has not fired yet
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(0);

            jasmine.clock().tick(1); // t=5000, fires on the original foreground schedule
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            eventManager.reset();
        });

        it('does not reschedule when foreground and background intervals are equal', async () => {
            const visibilityState = createMockVisibilityState(false);
            const getEvents = mockApi([
                { EventID: '2', More: 0 },
                { EventID: '3', More: 0 },
            ]);

            const eventManager = createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 10_000, background: 10_000 }),
                visibilityState,
            });

            // start() inside schedules at t=10000 (background, equal to foreground)
            eventManager.start();

            jasmine.clock().tick(5_000); // t=5000
            visibilityState.triggerChange(true); // equal intervals → no reschedule

            // Must still fire at the original t=10000, not sooner
            jasmine.clock().tick(4_999); // t=9999
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(0);

            jasmine.clock().tick(1); // t=10000
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            eventManager.reset();
        });

        it('reschedules sooner when page becomes visible during a long background interval', async () => {
            const visibilityState = createMockVisibilityState(false); // start hidden
            const getEvents = mockApi([
                { EventID: '2', More: 0 },
                { EventID: '3', More: 0 },
            ]);

            const eventManager = createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 5_000, background: 30_000 }),
                visibilityState,
            });

            // start() inside schedules at t=30000 (background)
            // STATE: timeoutStartTime=0, timeoutStartDelay=30000
            eventManager.start();

            jasmine.clock().tick(1_000); // t=1000
            visibilityState.triggerChange(true);
            // nextCallTime=30000, nextForegroundCallTime=5000
            // diff = 25000 >= 50 → reschedule
            // delay = max(50, 5000 - 1000) = 4000ms → fires at t=5000

            jasmine.clock().tick(3_999); // t=4999 — rescheduled call has not fired yet
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(0);

            jasmine.clock().tick(1); // t=5000 — fires on the rescheduled foreground time
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            eventManager.reset();
        });

        it('reschedules sooner when page becomes visible during a long background interval on the second run', async () => {
            const visibilityState = createMockVisibilityState(false); // start hidden
            const getEvents = mockApi([
                { EventID: '2', More: 0 },
                { EventID: '3', More: 0 },
            ]);

            const eventManager = createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 5_000, background: 30_000 }),
                visibilityState,
            });

            // start() inside schedules at t=30000 (background)
            // STATE: timeoutStartTime=0, timeoutStartDelay=30000
            eventManager.start();

            jasmine.clock().tick(29_999); // t=29999 — scheduled call has not fired yet
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(0);

            jasmine.clock().tick(1); // t=30000 — scheduled call has fired
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            jasmine.clock().tick(1_000); // t=1000
            visibilityState.triggerChange(true);
            // nextCallTime=30000, nextForegroundCallTime=5000
            // diff = 25000 >= 50 → reschedule
            // delay = max(50, 5000 - 1000) = 4000ms → fires at t=5000

            jasmine.clock().tick(3_999); // t=4999 — rescheduled call has not fired yet
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            jasmine.clock().tick(1); // t=5000 — fires on the rescheduled foreground time
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(2);

            eventManager.reset();
        });

        it('uses minDelay when page becomes visible after the foreground time has already passed', async () => {
            const visibilityState = createMockVisibilityState(false);
            const getEvents = mockApi([
                { EventID: '2', More: 0 },
                { EventID: '3', More: 0 },
            ]);

            const eventManager = createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 5_000, background: 30_000 }),
                visibilityState,
            });

            // start() inside schedules at t=30000 (background)
            // Foreground would have been at t=5000
            eventManager.start();

            jasmine.clock().tick(10_000); // t=10000, past the foreground call time of t=5000
            visibilityState.triggerChange(true);
            // diff = max(50, 5000 - 10000) = max(50, -5000) = 50ms → fires at t=10050

            jasmine.clock().tick(49); // t=10049 — not yet
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(0);

            jasmine.clock().tick(1); // t=10050 — fires after minDelay
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            eventManager.reset();
        });

        it('does not reschedule when the scheduled call is already close to the foreground time', async () => {
            const visibilityState = createMockVisibilityState(false);
            const getEvents = mockApi([
                { EventID: '2', More: 0 },
                { EventID: '3', More: 0 },
            ]);

            // background is only 49ms longer than foreground — just under the 50ms minDelay threshold
            const eventManager = createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState: createMockTimeoutIntervalsState({ foreground: 5_000, background: 5_049 }),
                visibilityState,
            });

            // start() inside schedules at t=5049 (background)
            eventManager.start();

            jasmine.clock().tick(1); // t=1
            visibilityState.triggerChange(true);
            // nextCallTime - nextForegroundCallTime = 5049 - 5000 = 49 < 50 → no reschedule

            // Must fire at the original t=5049, not at the foreground t=5000
            jasmine.clock().tick(4_998); // t=4999
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(0);

            jasmine.clock().tick(50); // t=5049
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            eventManager.reset();
        });
    });

    describe('timeout intervals state changes', () => {
        beforeEach(() => {
            jasmine.clock().install();
            jasmine.clock().mockDate(new Date(0));
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('uses the updated interval for the next scheduled call after intervals change', async () => {
            const visibilityState = createMockVisibilityState(true); // foreground
            const getEvents = mockApi([
                { EventID: '2', More: 0 },
                { EventID: '3', More: 0 },
            ]);

            const timeoutIntervalsState = createMockTimeoutIntervalsState({ foreground: 30_000, background: 30_000 });

            const eventManager = createEventManager({
                eventID: '1',
                getEvents,
                timeoutIntervalsState,
                visibilityState,
            });

            // start() schedules the first call at t=30000 (foreground interval)
            eventManager.start();

            jasmine.clock().tick(29_999); // t=29999 — not yet
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(0);

            jasmine.clock().tick(1); // t=30000 — first call fires
            // Simulate Unleash updating the interval before call() finishes re-scheduling
            timeoutIntervalsState.setIntervals({ foreground: 5_000, background: 5_000 });
            await flushPromises(); // call() completes → start() picks up new 5_000 interval → scheduleCall(30000, 5000)
            expect(getEvents).toHaveBeenCalledTimes(1);

            jasmine.clock().tick(4_999); // t=34999 — not yet
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(1);

            jasmine.clock().tick(1); // t=35000 — second call fires at new interval
            await flushPromises();
            expect(getEvents).toHaveBeenCalledTimes(2);

            eventManager.reset();
        });
    });
});
