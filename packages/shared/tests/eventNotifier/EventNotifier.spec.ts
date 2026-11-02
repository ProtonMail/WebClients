import { FIBONACCI_LIST, INTERVAL_EVENT_TIMER } from '../../lib/constants';
import type { VisibilityState } from '../../lib/eventManager/VisibilityState';
import { EventNotifier } from '../../lib/eventNotifier/EventNotifier';
import { EventNotifierLoopType, type EventNotifierPing } from '../../lib/eventNotifier/interface';
import type { EventNotifierConnection, EventNotifierConnectionHandlers } from '../../lib/eventNotifier/transports';
import type { Api } from '../../lib/interfaces/Api';

const URL = 'https://mail.proton.me/api/event-notifier/v1/events';

const CONNECTION_TOKEN_URL = 'event-notifier/v1/connection-token';

// Longest possible backoff of the first reconnection, jitter included.
const RECONNECT_DELAY = 3000;

// Longest possible backoff of any reconnection, jitter included.
const LONGEST_BACKOFF = 2000 * FIBONACCI_LIST[FIBONACCI_LIST.length - 1] + 1000;

const GAVE_UP = 'giving up on the connection after too many failed attempts';

interface FakeConnection extends EventNotifierConnection {
    url: string;
    closeCount: number;
    handlers: EventNotifierConnectionHandlers;
}

/** Substitutes the connection by overriding the protected seam, the way a consumer never would. */
class TestEventNotifier extends EventNotifier {
    public connections: FakeConnection[] = [];

    public throwOnCreate = false;

    public last() {
        return this.connections[this.connections.length - 1];
    }

    protected openConnection(url: string, handlers: EventNotifierConnectionHandlers): EventNotifierConnection {
        if (this.throwOnCreate) {
            throw new Error('cannot open a connection');
        }

        const connection: FakeConnection = {
            url,
            closeCount: 0,
            handlers,
            close: () => {
                connection.closeCount += 1;
            },
        };

        this.connections.push(connection);
        return connection;
    }
}

const createMockVisibilityState = () => {
    const callbacks: ((visible: boolean) => void)[] = [];
    const state = {
        visible: true,
        subscribe: vi.fn((cb: (visible: boolean) => void) => {
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
    return state as unknown as VisibilityState & { triggerChange: (visible: boolean) => void };
};

/** Delivers a frame the way the transports do, as an event name with string data. Like them, a closed connection delivers nothing. */
const emit = (connection: FakeConnection, name: string, data?: unknown) => {
    if (!connection.closeCount) {
        connection.handlers.onMessage(name, data);
    }
};

const drop = (connection: FakeConnection) => {
    if (!connection.closeCount) {
        connection.handlers.onDrop();
    }
};

const hello = (connection: FakeConnection, id = 'connection-1') => {
    emit(connection, 'Hello', JSON.stringify({ id }));
};

const flushPromises = async () => {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
    }
};

type ApiImplementation = (config: { signal?: AbortSignal }) => Promise<unknown>;

/** Hands out `token-1`, `token-2`… for the connection tokens, and defers the rest to `subscribe`. */
const createMockApi = ({
    subscribe = async () => ({}),
    fetchConnectionToken,
}: { subscribe?: ApiImplementation; fetchConnectionToken?: ApiImplementation } = {}) => {
    let tokenCount = 0;
    const api = vi.fn((config: { url: string; signal?: AbortSignal }) => {
        if (config.url === CONNECTION_TOKEN_URL) {
            tokenCount += 1;
            return (
                fetchConnectionToken?.(config) ?? Promise.resolve({ ConnectionToken: { Token: `token-${tokenCount}` } })
            );
        }
        return subscribe(config);
    });
    return api as Api & typeof api;
};

/** Stays pending until its signal aborts, then rejects the way `protonFetch` does. */
const pending: ApiImplementation = ({ signal }) =>
    new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
    });

const getSubscribeCalls = (api: ReturnType<typeof createMockApi>) =>
    api.mock.calls.filter(([config]) => config.url !== CONNECTION_TOKEN_URL);

const getConnectionToken = (connection: FakeConnection) =>
    new globalThis.URL(connection.url).searchParams.get('ConnectionToken');

/** Connecting waits for the connection token, so timers are advanced along with the promises. */
const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    await flushPromises();
};

const getReportedErrors = (onError: ReturnType<typeof vi.fn>) => {
    return onError.mock.calls.map(([message]) => message);
};

/** Fails every attempt until the notifier gives up, and returns how many were made. */
const exhaustReconnections = async ({
    connections,
    last,
}: {
    connections: FakeConnection[];
    last: () => FakeConnection;
}) => {
    for (let failure = 0; failure <= FIBONACCI_LIST.length; failure++) {
        drop(last());
        await advance(LONGEST_BACKOFF);
    }
    return connections.length;
};

const setup = ({
    api = createMockApi(),
    throwOnCreate = false,
}: { api?: ReturnType<typeof createMockApi>; throwOnCreate?: boolean } = {}) => {
    const visibilityState = createMockVisibilityState();
    const onPing = vi.fn<(ping: EventNotifierPing) => void>();
    const onError = vi.fn<(message: string, error?: unknown) => void>();

    const eventNotifier = new TestEventNotifier({
        api,
        url: URL,
        loops: [
            { Type: EventNotifierLoopType.Mail, Identifier: 'user-1' },
            { Type: EventNotifierLoopType.Legacy, Identifier: 'user-1' },
        ],
        onPing,
        onError,
        visibilityState,
    });
    eventNotifier.throwOnCreate = throwOnCreate;

    return {
        eventNotifier,
        start: async () => {
            eventNotifier.start();
            await flushPromises();
        },
        connections: eventNotifier.connections,
        last: () => eventNotifier.last(),
        api,
        onPing,
        onError,
        visibilityState,
    };
};

describe('event notifier', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should open a connection on start', async () => {
        const { eventNotifier, start, connections } = setup();

        await start();

        expect(connections.length).toBe(1);
        expect(connections[0].url).toBe(`${URL}?ConnectionToken=token-1`);

        eventNotifier.stop();
    });

    it('should only open one connection when started twice', async () => {
        const { eventNotifier, start, connections } = setup();

        eventNotifier.start();
        await start();

        expect(connections.length).toBe(1);

        eventNotifier.stop();
    });

    it('should subscribe to the loops with the connection id received in the hello frame', async () => {
        const { eventNotifier, start, api, last } = setup();

        await start();
        hello(last(), 'connection-42');

        expect(getSubscribeCalls(api)).toHaveLength(1);
        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({
                method: 'post',
                url: 'event-notifier/v1/connection/connection-42/loops',
                data: {
                    Add: [
                        { Type: EventNotifierLoopType.Mail, Identifier: 'user-1' },
                        { Type: EventNotifierLoopType.Legacy, Identifier: 'user-1' },
                    ],
                    Remove: [],
                },
                silence: true,
            })
        );

        eventNotifier.stop();
    });

    it('should notify a ping', async () => {
        const { eventNotifier, start, onPing, last } = setup();

        await start();
        hello(last());
        emit(last(), 'Ping', JSON.stringify({ type: 'mail', identifier: 'user-1' }));

        expect(onPing).toHaveBeenCalledTimes(1);
        expect(onPing).toHaveBeenCalledWith({ type: EventNotifierLoopType.Mail, identifier: 'user-1' });

        eventNotifier.stop();
    });

    it('should ignore malformed frames', async () => {
        const { eventNotifier, start, onPing, onError, last } = setup();

        await start();
        emit(last(), 'Ping', 'not json');
        emit(last(), 'Ping', JSON.stringify({ type: 'not-a-loop' }));

        expect(onPing).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();

        eventNotifier.stop();
    });

    it('should report a server error frame without dropping the connection', async () => {
        const { eventNotifier, start, onError, connections, last } = setup();

        await start();
        emit(last(), 'Error', 'too many connections');
        await advance(RECONNECT_DELAY);

        expect(onError).toHaveBeenCalledWith('server error: too many connections');
        expect(connections.length).toBe(1);
        expect(connections[0].closeCount).toBe(0);

        eventNotifier.stop();
    });

    it('should close a dropped connection and reconnect with a backoff', async () => {
        const { eventNotifier, start, api, connections, last, onError } = setup();

        await start();
        hello(last(), 'connection-1');
        drop(last());

        expect(connections[0].closeCount).toBe(1);
        expect(connections.length).toBe(1);
        expect(onError).toHaveBeenCalledWith('the connection dropped');

        await advance(RECONNECT_DELAY);

        expect(connections.length).toBe(2);

        hello(last(), 'connection-2');

        expect(getSubscribeCalls(api)).toHaveLength(2);
        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({ url: 'event-notifier/v1/connection/connection-2/loops' })
        );

        eventNotifier.stop();
    });

    it('should reconnect after a goodbye frame', async () => {
        const { eventNotifier, start, connections, last } = setup();

        await start();
        hello(last());
        emit(last(), 'Goodbye');

        expect(connections[0].closeCount).toBe(1);

        await advance(RECONNECT_DELAY);

        expect(connections.length).toBe(2);

        eventNotifier.stop();
    });

    it('should back off on consecutive failures and reset the backoff once connected', async () => {
        const { eventNotifier, start, connections, last } = setup();

        await start();

        // The first two reconnections are scheduled with the same fibonacci factor.
        for (let attempt = 1; attempt <= 2; attempt++) {
            drop(last());
            await advance(RECONNECT_DELAY);
            expect(connections.length).toBe(attempt + 1);
        }

        // The third one has to wait longer.
        drop(last());
        await advance(RECONNECT_DELAY);
        expect(connections.length).toBe(3);
        await advance(RECONNECT_DELAY);
        expect(connections.length).toBe(4);

        // A connection that stays up long enough resets the backoff, so the next failure is
        // scheduled from the start of the curve again.
        hello(last());
        await advance(INTERVAL_EVENT_TIMER);
        drop(last());
        await advance(RECONNECT_DELAY);
        expect(connections.length).toBe(5);

        eventNotifier.stop();
    });

    it('should give up once the whole backoff curve has been walked', async () => {
        const { eventNotifier, start, connections, last, onError } = setup();

        await start();
        const attempts = await exhaustReconnections({ connections, last });

        expect(attempts).toBe(FIBONACCI_LIST.length + 1);
        expect(getReportedErrors(onError)).toContain(GAVE_UP);

        // Nothing is retried any more, however long the tab stays open.
        drop(last());
        await advance(LONGEST_BACKOFF * 100);

        expect(connections.length).toBe(attempts);

        eventNotifier.stop();
    });

    it('should give up on a connection that keeps dropping right after greeting us', async () => {
        const { eventNotifier, start, connections, last, onError } = setup();

        await start();

        // Being greeted must not hand back a fresh attempt budget every round, otherwise a
        // server that greets us and drops the stream is retried for the lifetime of the tab.
        for (let round = 0; round < 50; round++) {
            hello(last(), `connection-${round}`);
            drop(last());
            await advance(LONGEST_BACKOFF);
        }

        expect(connections.length).toBe(FIBONACCI_LIST.length + 1);
        expect(getReportedErrors(onError)).toContain(GAVE_UP);

        eventNotifier.stop();
    });

    it('should reset the backoff once a connection has stayed up long enough', async () => {
        const { eventNotifier, start, connections, last } = setup();

        await start();

        // Two quick flaps advance the curve.
        for (let round = 0; round < 2; round++) {
            hello(last(), `connection-${round}`);
            drop(last());
            await advance(LONGEST_BACKOFF);
        }

        // This one lasts, which is what makes it count as healthy.
        hello(last(), 'connection-stable');
        await advance(INTERVAL_EVENT_TIMER);

        // So the whole curve is available again from here.
        const stableAt = connections.length;
        expect(await exhaustReconnections({ connections, last })).toBe(stableAt + FIBONACCI_LIST.length);

        eventNotifier.stop();
    });

    it('should resume after giving up when the network comes back', async () => {
        const { eventNotifier, start, connections, last } = setup();

        await start();
        const attempts = await exhaustReconnections({ connections, last });

        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(connections.length).toBe(attempts + 1);

        eventNotifier.stop();
    });

    it('should resume after giving up when the tab is focused again', async () => {
        const { eventNotifier, start, connections, last, visibilityState } = setup();

        await start();
        const attempts = await exhaustReconnections({ connections, last });

        visibilityState.triggerChange(true);
        await flushPromises();

        expect(connections.length).toBe(attempts + 1);

        // The attempt count is reset, so the whole curve is available again.
        const resumedAt = connections.length;
        expect(await exhaustReconnections({ connections, last })).toBe(resumedAt + FIBONACCI_LIST.length);

        eventNotifier.stop();
    });

    it('should reconnect with a backoff when the connection cannot be created', async () => {
        const { eventNotifier, start, onError } = setup({ throwOnCreate: true });

        await start();

        expect(onError).toHaveBeenCalledWith('failed to open the connection', expect.any(Error));

        // Reconnecting keeps failing, but it never throws nor loops synchronously.
        await advance(RECONNECT_DELAY);

        expect(onError).toHaveBeenCalledTimes(2);

        eventNotifier.stop();
    });

    it('should swallow a failing subscription', async () => {
        const error = new Error('nope');
        const api = createMockApi({
            subscribe: async () => {
                throw error;
            },
        });
        const { eventNotifier, start, onError, last } = setup({ api });

        await start();
        hello(last());
        await flushPromises();

        expect(onError).toHaveBeenCalledWith('failed to subscribe to the event loops', error);

        eventNotifier.stop();
    });

    it('should not report a subscription aborted by a reconnection as a failure', async () => {
        const { eventNotifier, start, onError, last } = setup({ api: createMockApi({ subscribe: pending }) });

        await start();
        hello(last());
        // The subscription is still in flight when the connection drops.
        drop(last());
        await flushPromises();

        expect(getReportedErrors(onError)).not.toContain('failed to subscribe to the event loops');
        // The drop itself is still worth reporting.
        expect(getReportedErrors(onError)).toContain('the connection dropped');

        eventNotifier.stop();
    });

    it('should not report a subscription aborted by stop as a failure', async () => {
        const { eventNotifier, start, onError, last } = setup({ api: createMockApi({ subscribe: pending }) });

        await start();
        hello(last());
        eventNotifier.stop();
        await flushPromises();

        expect(getReportedErrors(onError)).toEqual([]);
    });

    it('should close the connection and stop reconnecting on stop', async () => {
        const { eventNotifier, start, connections, last } = setup();

        await start();
        hello(last());
        eventNotifier.stop();

        expect(connections[0].closeCount).toBe(1);

        await advance(RECONNECT_DELAY * 20);

        expect(connections.length).toBe(1);
    });

    it('should not reconnect after the connection drops once stopped', async () => {
        const { eventNotifier, start, connections, last } = setup();

        await start();
        const connection = last();
        eventNotifier.stop();
        drop(connection);

        await advance(RECONNECT_DELAY * 20);

        expect(connections.length).toBe(1);
    });

    it('should reconnect immediately when the network comes back', async () => {
        const { eventNotifier, start, connections } = setup();

        await start();
        window.dispatchEvent(new Event('offline'));

        expect(connections[0].closeCount).toBe(1);

        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(connections.length).toBe(2);

        eventNotifier.stop();
    });

    it('should stop listening to the network events on stop', async () => {
        const { eventNotifier, start, connections } = setup();

        await start();
        eventNotifier.stop();
        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(connections.length).toBe(1);
    });

    it('should reconnect immediately when becoming visible again without a connection', async () => {
        const { eventNotifier, start, connections, last, visibilityState } = setup();

        await start();
        drop(last());
        visibilityState.triggerChange(false);
        visibilityState.triggerChange(true);
        await flushPromises();

        expect(connections.length).toBe(2);

        // The pending backoff has been cleared, so no extra connection is opened.
        await advance(RECONNECT_DELAY * 20);

        expect(connections.length).toBe(2);

        eventNotifier.stop();
    });

    it('should keep the connection when becoming visible again while connected', async () => {
        const { eventNotifier, start, connections, last, visibilityState } = setup();

        await start();
        hello(last());
        visibilityState.triggerChange(true);
        await flushPromises();

        expect(connections.length).toBe(1);
        expect(connections[0].closeCount).toBe(0);

        eventNotifier.stop();
    });

    it('should only authenticate the connection with the connection token', async () => {
        const { eventNotifier, start, api, last } = setup();

        await start();

        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({ method: 'post', url: CONNECTION_TOKEN_URL, silence: true })
        );
        expect([...new globalThis.URL(last().url).searchParams.keys()]).toEqual(['ConnectionToken']);

        eventNotifier.stop();
    });

    it('should fetch a fresh connection token for every reconnection', async () => {
        const { eventNotifier, start, connections, last } = setup();

        await start();
        drop(last());
        await advance(RECONNECT_DELAY);
        emit(last(), 'Goodbye');
        await advance(LONGEST_BACKOFF);

        expect(connections.map(getConnectionToken)).toEqual(['token-1', 'token-2', 'token-3']);

        eventNotifier.stop();
    });

    it('should not open the connection before the connection token is received', async () => {
        const { eventNotifier, start, connections } = setup({
            api: createMockApi({ fetchConnectionToken: pending }),
        });

        await start();

        expect(connections.length).toBe(0);

        eventNotifier.stop();
    });

    it('should retry with a backoff and a new token when fetching the connection token fails', async () => {
        const error = new Error('nope');
        let attempt = 0;
        const api = createMockApi({
            fetchConnectionToken: async () => {
                attempt += 1;
                if (attempt === 1) {
                    throw error;
                }
                return { ConnectionToken: { Token: `retried-${attempt}` } };
            },
        });
        const { eventNotifier, start, connections, onError } = setup({ api });

        await start();

        expect(onError).toHaveBeenCalledWith('failed to fetch a connection token', error);
        expect(connections.length).toBe(0);

        await advance(RECONNECT_DELAY);

        expect(connections.map(getConnectionToken)).toEqual(['retried-2']);

        eventNotifier.stop();
    });

    it.each([
        { name: 'no connection token', response: {} },
        { name: 'a connection token without its token', response: { ConnectionToken: {} } },
        { name: 'a connection token that is not nested', response: { ConnectionToken: 'token' } },
    ])('should treat a response with $name as a failure', async ({ response }) => {
        const { eventNotifier, start, connections, onError } = setup({
            api: createMockApi({ fetchConnectionToken: async () => response }),
        });

        await start();

        expect(getReportedErrors(onError)).toEqual(['failed to fetch a connection token']);
        expect(connections.length).toBe(0);

        eventNotifier.stop();
    });

    it('should give up when the connection token keeps failing', async () => {
        const { eventNotifier, start, api, onError } = setup({
            api: createMockApi({
                fetchConnectionToken: async () => {
                    throw new Error('unauthorized');
                },
            }),
        });

        await start();
        await advance(LONGEST_BACKOFF * (FIBONACCI_LIST.length + 1));

        expect(getReportedErrors(onError)).toContain(GAVE_UP);
        expect(api).toHaveBeenCalledTimes(FIBONACCI_LIST.length + 1);

        eventNotifier.stop();
    });

    it('should not connect nor report anything when stopped while fetching the connection token', async () => {
        const { eventNotifier, start, connections, onError, api } = setup({
            api: createMockApi({ fetchConnectionToken: pending }),
        });

        await start();
        eventNotifier.stop();
        await advance(LONGEST_BACKOFF);

        expect(api.mock.calls[0][0].signal?.aborted).toBe(true);
        expect(connections.length).toBe(0);
        expect(getReportedErrors(onError)).toEqual([]);
    });

    it('should not fetch a second connection token when becoming visible while fetching one', async () => {
        const { eventNotifier, start, api, visibilityState } = setup({
            api: createMockApi({ fetchConnectionToken: pending }),
        });

        await start();
        visibilityState.triggerChange(true);
        await flushPromises();

        expect(api).toHaveBeenCalledTimes(1);
        expect(api.mock.calls[0][0].signal?.aborted).toBe(false);

        eventNotifier.stop();
    });
});
