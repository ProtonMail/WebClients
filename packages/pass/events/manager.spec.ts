import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

import type { Api } from '../types';
import { eventManager } from './manager';

const TEST_INTERVAL = 5_000;
const getTestEventID = (n: number = 1) => `TEST_EVENT_ID_${n}`;

const createMockedEventManager = () => {
    const mockApi = jest.fn().mockImplementation(() => Promise.resolve({}));
    const mockQuery = jest.fn().mockImplementation(() => ({ url: 'test/endpoint' }));
    const mockGetCursor = jest.fn().mockImplementation((res) => ({ EventID: res.EventID, More: Boolean(res.More) }));

    const manager = eventManager({
        api: mockApi as any as Api,
        initialEventID: getTestEventID(0),
        interval: TEST_INTERVAL,
        query: mockQuery,
        getCursor: mockGetCursor,
    });

    return {
        manager,
        api: mockApi as jest.Mock,
        query: mockQuery as jest.Mock,
        setApiResponse: (EventID: string, More: 0 | 1) => mockApi.mockResolvedValue({ EventID, More }),
    };
};

describe('event manager', () => {
    beforeEach(() => jest.useFakeTimers());

    test('should initialize configuration correctly', () => {
        const { manager } = createMockedEventManager();

        const state = manager.state;
        expect(manager.getEventID()).toEqual(getTestEventID(0));
        expect(state.lastEventID).toEqual(getTestEventID(0));
        expect(state.interval).toEqual(5_000);
        expect(state.abortController).toBe(undefined);
        expect(state.timeoutHandle).toBe(undefined);
        expect(state.retryIndex).toEqual(0);
    });

    test('setters should update internal state', () => {
        const { manager } = createMockedEventManager();
        manager.setEventID(getTestEventID(1));
        manager.setInterval(30_000);

        expect(manager.state.lastEventID).toEqual(getTestEventID(1));
        expect(manager.state.interval).toEqual(30_000);
    });

    test('should immediately call API when calling `call()`', async () => {
        const { manager, api, query } = createMockedEventManager();

        api.mockResolvedValue({ EventID: getTestEventID(1), More: 0 });
        await manager.call();

        expect(api).toHaveBeenCalledTimes(1);
        expect(query.mock.calls[0][0]).toEqual(getTestEventID(0));

        expect(manager.state.lastEventID).toEqual(getTestEventID(1));
        expect(manager.state.timeoutHandle).toBeDefined();
        expect(manager.state.abortController).not.toBeDefined();
        expect(manager.state.retryIndex).toEqual(0);

        manager.stop();
    });

    test('should handle `More` data and re-request API in the same timeout', async () => {
        const { manager, api, query } = createMockedEventManager();
        let count = 0;

        api.mockImplementation(() => {
            count += 1;
            return Promise.resolve({
                EventID: getTestEventID(count),
                More: count == 2 ? 0 : 1,
            });
        });

        await manager.call();

        expect(api).toHaveBeenCalledTimes(2);
        expect(query.mock.calls[0][0]).toEqual(getTestEventID(0));
        expect(query.mock.calls[1][0]).toEqual(getTestEventID(1));

        expect(manager.state.lastEventID).toEqual(getTestEventID(2));
        expect(manager.state.timeoutHandle).toBeDefined();
        expect(manager.state.abortController).not.toBeDefined();
        expect(manager.state.retryIndex).toEqual(0);

        manager.stop();
    });

    test('should start polling after interval when calling `start()`', async () => {
        const { manager, api } = createMockedEventManager();
        api.mockResolvedValue({ EventID: getTestEventID(1), More: 0 });
        manager.start();

        expect(manager.state.timeoutHandle).toBeDefined();
        jest.advanceTimersByTime(TEST_INTERVAL);

        expect(api).toHaveBeenCalledTimes(1);
        expect(manager.state.abortController).toBeDefined();

        await jest.advanceTimersToNextTimerAsync();

        expect(manager.state.lastEventID).toEqual(getTestEventID(1));
        expect(manager.state.retryIndex).toEqual(0);
        expect(manager.state.abortController).not.toBeDefined();
        expect(manager.state.timeoutHandle).toBeDefined();

        manager.stop();
    });

    test('should cancel timeout when calling `stop()`', async () => {
        const { manager, api, query } = createMockedEventManager();
        api.mockResolvedValue({ EventID: getTestEventID(1), More: 0 });
        manager.start();

        expect(manager.state.timeoutHandle).toBeDefined();
        jest.advanceTimersByTime(TEST_INTERVAL - 1);

        manager.stop();
        await jest.advanceTimersToNextTimerAsync();

        jest.advanceTimersByTime(1);

        expect(api).not.toHaveBeenCalled();
        expect(query).not.toHaveBeenCalled();

        expect(manager.state.lastEventID).toEqual(getTestEventID(0));
        expect(manager.state.retryIndex).toEqual(0);
        expect(manager.state.abortController).not.toBeDefined();
        expect(manager.state.timeoutHandle).not.toBeDefined();
    });

    test('should stop and reset internal state when calling `reset()`', async () => {
        const { manager, api, query } = createMockedEventManager();
        api.mockResolvedValue({ EventID: getTestEventID(1), More: 0 });
        manager.start();

        expect(manager.state.timeoutHandle).toBeDefined();
        jest.advanceTimersByTime(TEST_INTERVAL - 1);

        manager.reset();
        await jest.advanceTimersToNextTimerAsync();

        jest.advanceTimersByTime(1);

        expect(api).not.toHaveBeenCalled();
        expect(query).not.toHaveBeenCalled();

        expect(manager.state.lastEventID).not.toBeDefined();
        expect(manager.state.retryIndex).toEqual(0);
        expect(manager.state.abortController).not.toBeDefined();
        expect(manager.state.timeoutHandle).not.toBeDefined();
    });

    test('should notify listeners on events & errors', async () => {
        const { manager, api } = createMockedEventManager();
        const listener = jest.fn().mockImplementation();
        manager.subscribe(listener);

        let count = 0;
        api.mockImplementation(() => {
            count += 1;
            return Promise.resolve({
                EventID: getTestEventID(count),
                More: 0,
            });
        });

        manager.start();

        while (count < 5) {
            await jest.advanceTimersToNextTimerAsync();
            expect(listener).toHaveBeenCalledTimes(count);
            expect(listener.mock.calls[count - 1][0]).toEqual({ EventID: getTestEventID(count), More: 0 });
        }

        api.mockImplementation(() => Promise.reject('FAILURE'));
        await jest.advanceTimersToNextTimerAsync();
        expect(listener).toHaveBeenCalledTimes(count + 1);
        expect(listener.mock.calls[count][0]).toEqual({ error: 'FAILURE' });

        manager.stop();
    });

    test('retry behaviour should throttle interval', async () => {
        const { manager, api } = createMockedEventManager();

        api.mockImplementation(() => Promise.reject('FAILURE'));
        manager.start();

        let count = 0;
        while (count < 10) {
            count++;
            await jest.advanceTimersByTimeAsync(TEST_INTERVAL * FIBONACCI_LIST[manager.state.retryIndex]);
            const retryIndex = Math.min(count, FIBONACCI_LIST.length - 1);
            expect(manager.state.retryIndex).toEqual(retryIndex);
        }

        expect(api).toHaveBeenCalledTimes(10);
    });
});
