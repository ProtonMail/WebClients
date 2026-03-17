import { CONNECTIVITY_RETRY_TIMEOUT, ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import type { Api, ApiState, ApiSubscriptionEvent } from '@proton/pass/types';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

import { createConnectivityService } from './connectivity.service';

const setupTestAPI = () => {
    let apiState = { online: true, unreachable: false } as ApiState;

    const pubsub = createPubSub<ApiSubscriptionEvent>();
    const api = jest.fn(async () => {}) as unknown as Api;
    api.getState = () => apiState;
    api.subscribe = pubsub.subscribe;

    const setState = (updates: Partial<ApiState>) => (apiState = { ...apiState, ...updates });

    const publish = (event: ApiSubscriptionEvent) => {
        pubsub.publish(event);
        if (event.type === 'connectivity') setState(event);
    };

    return { api, publish, setState };
};

const setNavigatorOnline = (online: boolean) => {
    const event = new Event(online ? 'online' : 'offline');
    globalThis.dispatchEvent(event);

    Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: online,
    });
};

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
});

test('initializes with correct status based on navigator.onLine', () => {
    setNavigatorOnline(true);
    const { api } = setupTestAPI();
    const service = createConnectivityService({ api });

    expect(service.getStatus()).toBe(ConnectivityStatus.ONLINE);

    service.destroy();
});

test('publishes status changes to subscribers', () => {
    setNavigatorOnline(true);
    const { api, publish } = setupTestAPI();
    const service = createConnectivityService({ api });
    service.init();

    const statusChanges: ConnectivityStatus[] = [];
    const unsubscribe = service.subscribe((status) => statusChanges.push(status));

    publish({ type: 'connectivity', online: false, unreachable: false });
    expect(statusChanges).toContain(ConnectivityStatus.OFFLINE);
    expect(service.getStatus()).toBe(ConnectivityStatus.OFFLINE);

    unsubscribe();
    service.destroy();
});

test('handles unreachable state (downtime)', () => {
    setNavigatorOnline(true);
    const { api, publish } = setupTestAPI();
    const service = createConnectivityService({ api });

    service.init();
    publish({ type: 'connectivity', online: true, unreachable: true });
    expect(service.getStatus()).toBe(ConnectivityStatus.DOWNTIME);

    service.destroy();
});

test('triggers initial retry when starting offline', () => {
    setNavigatorOnline(false);
    const { api, setState } = setupTestAPI();
    setState({ online: false, unreachable: false });

    const service = createConnectivityService({ api });
    service.init();

    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenNthCalledWith(1, { method: 'get', unauthenticated: true, url: 'tests/ping' });
    service.destroy();
});

test('retries with linear backoff when offline', async () => {
    setNavigatorOnline(false);
    const { api, setState } = setupTestAPI();
    setState({ online: false, unreachable: false });

    const service = createConnectivityService({ api });
    service.init();

    let callCount = 0;

    for (let i = 0; i < 5; i++) {
        callCount++;
        jest.advanceTimersByTime(CONNECTIVITY_RETRY_TIMEOUT);
        expect(api).toHaveBeenCalledTimes(callCount);
        expect(api).toHaveBeenNthCalledWith(callCount, { method: 'get', unauthenticated: true, url: 'tests/ping' });
        await jest.runOnlyPendingTimersAsync();
    }

    service.destroy();
});

test('retries with exponential backoff when unreachable', async () => {
    setNavigatorOnline(true);
    const { api, setState, publish } = setupTestAPI();
    setState({ online: true, unreachable: true });

    const service = createConnectivityService({ api });
    service.init();

    publish({ type: 'connectivity', online: true, unreachable: true });

    let callCount = 0;

    for (const idx of FIBONACCI_LIST) {
        callCount++;
        jest.advanceTimersByTime(CONNECTIVITY_RETRY_TIMEOUT * idx);
        expect(api).toHaveBeenCalledTimes(callCount);
        expect(api).toHaveBeenNthCalledWith(callCount, { method: 'get', unauthenticated: true, url: 'tests/ping' });
        await jest.runOnlyPendingTimersAsync();
    }

    service.destroy();
});

test('stops retry loop when going online', () => {
    setNavigatorOnline(false);
    const { api, setState, publish } = setupTestAPI();
    setState({ online: false, unreachable: false });

    const service = createConnectivityService({ api });

    /** 1. Initial connection test */
    service.init();
    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenNthCalledWith(1, { method: 'get', unauthenticated: true, url: 'tests/ping' });

    /** 2. Go online */
    setNavigatorOnline(true);
    publish({ type: 'connectivity', online: true, unreachable: false });
    expect(service.getStatus()).toBe(ConnectivityStatus.ONLINE);

    /** 3. Verify retry handler has been cancelled  */
    jest.advanceTimersByTime(CONNECTIVITY_RETRY_TIMEOUT);
    expect(api).toHaveBeenCalledTimes(1);

    service.destroy();
});
