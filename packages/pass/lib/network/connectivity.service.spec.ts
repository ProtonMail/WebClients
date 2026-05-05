import { CONNECTIVITY_RETRY_TIMEOUT, ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import type { Api, ApiState, ApiSubscriptionEvent } from '@proton/pass/types';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { ConnectivityService } from './connectivity.service';
import { CONNECTIVITY_CHECK_DELAY, createConnectivityService } from './connectivity.service';

const TEST_IDLE_TIMEOUT = 5_000;

/** Mock API - all requests will resolve by default.
 * - `ConnectivityService::check` -> reads `api.getState` directly
 * - use mock `publish` to simulate API events */
const setupMockAPI = () => {
    let apiState = { online: true, unreachable: false, pendingCount: 0 } as ApiState;

    const pubsub = createPubSub<ApiSubscriptionEvent>();
    const api = jest.fn(async () => {}) as unknown as Api;
    api.idle = () => wait(TEST_IDLE_TIMEOUT);

    const setState = (updates: Partial<ApiState>) => (apiState = { ...apiState, ...updates });
    const publish = (event: ApiSubscriptionEvent) => {
        pubsub.publish(event);
        if (event.type === 'connectivity') setState(event);
    };

    api.getState = () => apiState;
    api.subscribe = pubsub.subscribe;

    return { api, publish, setState };
};

/** JSDOM workaround for navigator events */
const setNavigatorOnline = (online: boolean) => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });
    const event = new Event(online ? 'online' : 'offline');
    globalThis.dispatchEvent(event);
};

const EXPECTED_PING = {
    method: 'get',
    unauthenticated: true,
    url: 'tests/ping',
    signal: expect.any(AbortSignal),
};

/** Flush queued microtasks without advancing timers. */
const nextTick = () => Promise.resolve();

/** Verifies the next retry's `check` fires exactly after `delay` ms:
 * - At `delay - 1`: api still not called
 * - At `delay`: api called once more (retry timer fired)
 * Then advances `CONNECTIVITY_CHECK_DELAY` more to settle so the next
 * retry timer is scheduled before the helper returns. */
const expectNextCheck = async (api: Api, delay: number) => {
    const before = (api as unknown as jest.Mock).mock.calls.length;

    /** Just-before boundary: no new check */
    await jest.advanceTimersByTimeAsync(delay - 1);
    expect(api).toHaveBeenCalledTimes(before);

    /** Retry timer fires & dispatches `check` */
    await jest.advanceTimersByTimeAsync(1);
    expect(api).toHaveBeenCalledTimes(before + 1);
    expect(api).toHaveBeenLastCalledWith(EXPECTED_PING);

    /** Settle internal delay so the next retry timer is scheduled */
    await jest.advanceTimersByTimeAsync(CONNECTIVITY_CHECK_DELAY);
};

/** Bootstraps a service and waits for the initial `check` to complete.
 * Asserts a single bootstrap ping was dispatched, then clears the mock so
 * the test starts from a clean call-count baseline. */
const initService = async (service: ConnectivityService, api: Api) => {
    void service.init();
    await jest.runOnlyPendingTimersAsync();
    expect(api).toHaveBeenCalledTimes(1);
    (api as unknown as jest.Mock).mockClear();
};

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
});

afterEach(() => {
    jest.clearAllTimers();
});

describe('ConnectivityService', () => {
    test('initializes with correct status based on navigator.onLine', () => {
        setNavigatorOnline(true);
        const { api } = setupMockAPI();
        const service = createConnectivityService({ api });

        expect(service.status).toBe(ConnectivityStatus.ONLINE);
        expect(service.retryHandler).toBe(null);

        service.destroy();
    });

    test('handles api OFFLINE state and publishes accordingly', async () => {
        /** 1. Set navigator.onLine = true */
        setNavigatorOnline(true);

        const { api, publish } = setupMockAPI();
        const service = createConnectivityService({ api });
        const statusChanges: ConnectivityStatus[] = [];
        const unsubscribe = service.subscribe((status) => statusChanges.push(status));

        /** 2. wait for initial `check` */
        void service.init();
        await jest.runOnlyPendingTimersAsync();

        /** 3. Simulate OFFLINE api event */
        publish({ type: 'connectivity', online: false, unreachable: false });

        expect(statusChanges).toContain(ConnectivityStatus.OFFLINE);
        expect(service.status).toBe(ConnectivityStatus.OFFLINE);

        unsubscribe();
        service.destroy();
    });

    test('handles api UNREACHABLE state & publishes accordingly', async () => {
        /** 1. Set navigator.onLine = true */
        setNavigatorOnline(true);

        const { api, publish } = setupMockAPI();
        const service = createConnectivityService({ api });
        const statusChanges: ConnectivityStatus[] = [];
        const unsubscribe = service.subscribe((status) => statusChanges.push(status));

        /** 2. wait for initial `check` */
        void service.init();
        await jest.runOnlyPendingTimersAsync();

        /** 3. Simulate UNREACHABLE api event */
        publish({ type: 'connectivity', online: true, unreachable: true });

        expect(statusChanges).toContain(ConnectivityStatus.DOWNTIME);
        expect(service.status).toBe(ConnectivityStatus.DOWNTIME);

        unsubscribe();
        service.destroy();
    });

    test('defers first retry when starting offline', async () => {
        /** 1. Set navigator.onLine = false & initial offline API state */
        const { api, setState } = setupMockAPI();
        setNavigatorOnline(false);
        setState({ online: false, unreachable: false });
        const service = createConnectivityService({ api });

        /** 2. Init creates retry handler synchronously — `check` must NOT run yet */
        void service.init();
        await nextTick();
        expect(service.retryHandler).not.toBe(null);
        expect(api).not.toHaveBeenCalled();

        /** 3. First check fires exactly after CONNECTIVITY_RETRY_TIMEOUT */
        await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT);

        service.destroy();
    });

    test('starts retry handler when init check reveals OFFLINE despite navigator.onLine', async () => {
        setNavigatorOnline(true);
        const { api, setState } = setupMockAPI();
        setNavigatorOnline(false);
        setState({ online: false, unreachable: false });
        const service = createConnectivityService({ api });

        await service.init();
        expect(service.retryHandler).not.toBeNull();
        expect(service.status).toBe(ConnectivityStatus.OFFLINE);
    });

    test('retries with linear backoff when API is offline', async () => {
        /** 1. Set navigator.onLine = true & initial online API state */
        const { api, setState, publish } = setupMockAPI();
        setNavigatorOnline(true);
        setState({ online: true, unreachable: false });
        const service = createConnectivityService({ api });

        /** 2. Wait for initial `check` */
        await initService(service, api);

        /** 3. Set navigator.onLine = true & publish OFFLINE api event */
        setNavigatorOnline(true);
        publish({ type: 'connectivity', online: false, unreachable: false });
        expect(service.retryHandler).not.toBe(null);

        /** 4. Each retry fires exactly `CONNECTIVITY_RETRY_TIMEOUT` after the previous */
        for (let i = 0; i < 5; i++) {
            await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT);
            expect(service.retryHandler).not.toBe(null);
        }

        /** 5. Set navigator.onLine = true & publish ONLINE api event */
        setNavigatorOnline(true);
        publish({ type: 'connectivity', online: true, unreachable: false });

        /** 6. Ensure retry handler is cleared & no new pings dispatched */
        expect(service.retryHandler).toBe(null);
        (api as unknown as jest.Mock).mockClear();
        await jest.runAllTimersAsync();
        expect(api).not.toHaveBeenCalled();

        service.destroy();
    });

    test('retries with linear backoff when navigator is offline', async () => {
        /** 1. Set navigator.onLine = true */
        setNavigatorOnline(true);
        const { api, setState } = setupMockAPI();
        const service = createConnectivityService({ api });

        /** 2. Wait for initial `check` */
        await initService(service, api);
        expect(service.retryHandler).toBe(null);

        /** 3. Set navigator.onLine = false  */
        setNavigatorOnline(false);
        setState({ online: false, unreachable: false });
        expect(service.retryHandler).not.toBe(null);

        /** 4. Each retry fires exactly `CONNECTIVITY_RETRY_TIMEOUT` after the previous */
        for (let i = 0; i < 5; i++) {
            await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT);
            expect(service.retryHandler).not.toBe(null);
        }

        service.destroy();
    });

    test('retries with exponential backoff when API is unreachable', async () => {
        /** 1. Set navigator.onLine = true */
        setNavigatorOnline(true);

        const { api, publish } = setupMockAPI();
        const service = createConnectivityService({ api });

        /** 2. Wait for initial `check` */
        await initService(service, api);

        /** 3. Publish a UNREACHABLE api event */
        publish({ type: 'connectivity', online: true, unreachable: true });

        /** 4. Each retry fires exactly `CONNECTIVITY_RETRY_TIMEOUT * FIBONACCI_LIST[N]` after the previous */
        for (let i = 0; i < FIBONACCI_LIST.length; i++) {
            await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT * FIBONACCI_LIST[i]);
            expect(service.retryHandler).not.toBe(null);
        }

        /** 5. Publish ONLINE api event */
        publish({ type: 'connectivity', online: true, unreachable: false });

        /** 6. Ensure retry handler is cleared & no new pings dispatched */
        expect(service.retryHandler).toBe(null);
        (api as unknown as jest.Mock).mockClear();
        await jest.runAllTimersAsync();
        expect(api).not.toHaveBeenCalled();

        service.destroy();
    });

    test('next retry timer adapts to latest result status', async () => {
        /** 1. Set navigator.onLine = true */
        setNavigatorOnline(true);
        const { api, publish, setState } = setupMockAPI();
        const service = createConnectivityService({ api });

        /** 2. Wait for initial `check` (api ONLINE) */
        await initService(service, api);

        /** 3. Publish UNREACHABLE → handler starts in DOWNTIME (Fibonacci) */
        publish({ type: 'connectivity', online: true, unreachable: true });

        /** 4. First retry uses FIB[0]=1 → 5000ms */
        await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT * FIBONACCI_LIST[0]);

        /** 5. Flip api state to OFFLINE before the next retry tick (no event published) */
        setState({ online: false, unreachable: false });

        /** 6. Second retry was scheduled with status=DOWNTIME → FIB[1]*5000=5000ms.
         * The check now detects the new OFFLINE state and updates status accordingly */
        await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT * FIBONACCI_LIST[1]);
        expect(service.status).toBe(ConnectivityStatus.OFFLINE);

        /** 7. Third retry was scheduled AFTER the OFFLINE detection → linear (5000ms),
         * NOT FIB[2]*5000=10_000ms */
        await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT);

        service.destroy();
    });

    test('destroy cancels deferred retry before any check fires', async () => {
        /** 1. Set navigator.onLine = false & initial offline API state */
        const { api, setState } = setupMockAPI();
        setNavigatorOnline(false);
        setState({ online: false, unreachable: false });
        const service = createConnectivityService({ api });

        /** 2. Init creates retry handler with deferred timer */
        void service.init();
        await nextTick();
        expect(service.retryHandler).not.toBe(null);
        expect(api).not.toHaveBeenCalled();

        /** 3. Destroy before first retry fires */
        service.destroy();
        expect(service.retryHandler).toBe(null);

        /** 4. No api call should fire even after long advance */
        await jest.advanceTimersByTimeAsync(CONNECTIVITY_RETRY_TIMEOUT * 10);
        expect(api).not.toHaveBeenCalled();
    });

    test('destroy stops retry loop mid-cycle', async () => {
        /** 1. Set navigator.onLine = true */
        setNavigatorOnline(true);
        const { api, publish } = setupMockAPI();
        const service = createConnectivityService({ api });

        /** 2. Wait for initial `check` */
        await initService(service, api);

        /** 3. Trigger OFFLINE retry loop */
        publish({ type: 'connectivity', online: false, unreachable: false });

        /** 4. Run 2 retries successfully */
        await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT);
        await expectNextCheck(api, CONNECTIVITY_RETRY_TIMEOUT);

        /** 5. Destroy mid-cycle: no further checks should fire */
        service.destroy();
        expect(service.retryHandler).toBe(null);

        (api as unknown as jest.Mock).mockClear();
        await jest.runAllTimersAsync();
        expect(api).not.toHaveBeenCalled();
    });

    test('skips `ping` when requests are pending and waits for drain', async () => {
        /** 1. Online init so the bootstrap `check` runs and drains cleanly */
        setNavigatorOnline(true);
        const { api, setState } = setupMockAPI();
        const service = createConnectivityService({ api });
        await initService(service, api);

        /** 2. Simulate in-flight requests, then invoke `check` directly:
         * it must skip the ping and await `api.idle()` instead. */
        setState({ online: true, unreachable: false, pendingCount: 2 });
        const pending = service.check();

        await jest.advanceTimersByTimeAsync(TEST_IDLE_TIMEOUT - 1);
        expect(api).not.toHaveBeenCalled();

        /** 3. Drain: zero pendingCount and let `api.idle()` resolve.
         * Status derives from API state without any ping fired. */
        setState({ online: true, unreachable: false, pendingCount: 0 });
        await jest.advanceTimersByTimeAsync(1 + CONNECTIVITY_CHECK_DELAY);
        await pending;
        expect(api).not.toHaveBeenCalled();
        expect(service.status).toBe(ConnectivityStatus.ONLINE);

        service.destroy();
    });

    test('fires ping when no requests are pending', async () => {
        setNavigatorOnline(true);
        const { api, setState } = setupMockAPI();
        setState({ online: true, unreachable: false, pendingCount: 0 });

        const service = createConnectivityService({ api });
        void service.init();
        await jest.runOnlyPendingTimersAsync();

        expect(api).toHaveBeenCalledTimes(1);
        expect(api).toHaveBeenCalledWith({ method: 'get', unauthenticated: true, url: 'tests/ping' });

        service.destroy();
    });
});
