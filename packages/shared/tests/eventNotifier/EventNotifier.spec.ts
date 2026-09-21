import { FIBONACCI_LIST, INTERVAL_EVENT_TIMER } from '../../lib/constants';
import type { VisibilityState } from '../../lib/eventManager/VisibilityState';
import { EventNotifier } from '../../lib/eventNotifier/EventNotifier';
import { EventNotifierLoopType, type EventNotifierPing } from '../../lib/eventNotifier/interface';
import type { Api } from '../../lib/interfaces';

const URL = 'https://mail.proton.me/api/event-notifier/v1/events';

// Longest possible backoff of the first reconnection, jitter included.
const RECONNECT_DELAY = 3000;

// Longest possible backoff of any reconnection, jitter included.
const LONGEST_BACKOFF = 2000 * FIBONACCI_LIST[FIBONACCI_LIST.length - 1] + 1000;

const GAVE_UP = 'giving up on the connection after too many failed attempts';

type Listener = (event: MessageEvent) => void;

interface FakeEventSource {
    url: string;
    closeCount: number;
    listeners: Record<string, Listener[]>;
    onerror: (() => void) | null;
    addEventListener: (name: string, listener: Listener) => void;
    removeEventListener: (name: string, listener: Listener) => void;
    close: () => void;
}

/** Substitutes the connection by overriding the protected seam, the way a consumer never would. */
class TestEventNotifier extends EventNotifier {
    public sources: FakeEventSource[] = [];

    public throwOnCreate = false;

    public last() {
        return this.sources[this.sources.length - 1];
    }

    protected createEventSource(): EventSource {
        if (this.throwOnCreate) {
            throw new Error('cannot open a connection');
        }

        const source: FakeEventSource = {
            url: this.url,
            closeCount: 0,
            listeners: {},
            onerror: null,
            addEventListener: (name, listener) => {
                source.listeners[name] = [...(source.listeners[name] ?? []), listener];
            },
            removeEventListener: (name, listener) => {
                source.listeners[name] = (source.listeners[name] ?? []).filter((item) => item !== listener);
            },
            close: () => {
                source.closeCount += 1;
            },
        };

        this.sources.push(source);
        return source as unknown as EventSource;
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

/** Dispatches an SSE frame the way `EventSource` would, as a named event carrying string data. */
const emit = (source: FakeEventSource, name: string, data?: unknown) => {
    (source.listeners[name] ?? []).forEach((listener) => listener({ type: name, data } as MessageEvent));
};

const hello = (source: FakeEventSource, id = 'connection-1') => {
    emit(source, 'Hello', JSON.stringify({ id }));
};

const flushPromises = async () => {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
    }
};

const createMockApi = (implementation: (config: { signal?: AbortSignal }) => Promise<unknown> = async () => ({})) => {
    const api = vi.fn(implementation);
    return api as Api & typeof api;
};

/** Stays pending until its signal aborts, then rejects the way `protonFetch` does. */
const createPendingApi = () =>
    createMockApi(
        ({ signal }) =>
            new Promise((_resolve, reject) => {
                signal?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted.', 'AbortError'));
                });
            })
    );

const getReportedErrors = (onError: ReturnType<typeof vi.fn>) => {
    return onError.mock.calls.map(([message]) => message);
};

/** Fails every attempt until the notifier gives up, and returns how many were made. */
const exhaustReconnections = ({ sources, last }: { sources: FakeEventSource[]; last: () => FakeEventSource }) => {
    for (let failure = 0; failure <= FIBONACCI_LIST.length; failure++) {
        last().onerror?.();
        vi.advanceTimersByTime(LONGEST_BACKOFF);
    }
    return sources.length;
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
        sources: eventNotifier.sources,
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

    it('should open a connection on start', () => {
        const { eventNotifier, sources } = setup();

        eventNotifier.start();

        expect(sources.length).toBe(1);
        expect(sources[0].url).toBe(URL);

        eventNotifier.stop();
    });

    it('should only open one connection when started twice', () => {
        const { eventNotifier, sources } = setup();

        eventNotifier.start();
        eventNotifier.start();

        expect(sources.length).toBe(1);

        eventNotifier.stop();
    });

    it('should subscribe to the loops with the connection id received in the hello frame', () => {
        const { eventNotifier, api, last } = setup();

        eventNotifier.start();
        hello(last(), 'connection-42');

        expect(api).toHaveBeenCalledTimes(1);
        expect(api).toHaveBeenCalledWith(
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

    it('should notify a ping', () => {
        const { eventNotifier, onPing, last } = setup();

        eventNotifier.start();
        hello(last());
        emit(last(), 'Ping', JSON.stringify({ type: 'mail', identifier: 'user-1' }));

        expect(onPing).toHaveBeenCalledTimes(1);
        expect(onPing).toHaveBeenCalledWith({ type: EventNotifierLoopType.Mail, identifier: 'user-1' });

        eventNotifier.stop();
    });

    it('should ignore malformed frames', () => {
        const { eventNotifier, onPing, onError, last } = setup();

        eventNotifier.start();
        emit(last(), 'Ping', 'not json');
        emit(last(), 'Ping', JSON.stringify({ type: 'not-a-loop' }));

        expect(onPing).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();

        eventNotifier.stop();
    });

    it('should report a server error frame without dropping the connection', () => {
        const { eventNotifier, onError, sources, last } = setup();

        eventNotifier.start();
        emit(last(), 'Error', 'too many connections');
        vi.advanceTimersByTime(RECONNECT_DELAY);

        expect(onError).toHaveBeenCalledWith('server error: too many connections');
        expect(sources.length).toBe(1);
        expect(sources[0].closeCount).toBe(0);

        eventNotifier.stop();
    });

    it('should close and reconnect itself instead of letting EventSource retry', () => {
        const { eventNotifier, api, sources, last, onError } = setup();

        eventNotifier.start();
        hello(last(), 'connection-1');
        last().onerror?.();

        // The connection is torn down right away so that EventSource stops retrying on its own.
        expect(sources[0].closeCount).toBe(1);
        expect(sources.length).toBe(1);
        expect(onError).toHaveBeenCalledWith('the connection dropped');

        vi.advanceTimersByTime(RECONNECT_DELAY);

        expect(sources.length).toBe(2);

        hello(last(), 'connection-2');

        expect(api).toHaveBeenCalledTimes(2);
        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({ url: 'event-notifier/v1/connection/connection-2/loops' })
        );

        eventNotifier.stop();
    });

    it('should detach its listeners when closing, so a teardown error does not reconnect twice', () => {
        const { eventNotifier, sources, last } = setup();

        eventNotifier.start();
        const source = last();
        source.onerror?.();

        expect(source.onerror).toBeNull();
        expect(source.listeners.Ping).toEqual([]);

        // Replaying the detached handlers must not schedule anything.
        emit(source, 'Ping', JSON.stringify({ type: 'mail' }));
        vi.advanceTimersByTime(RECONNECT_DELAY);

        expect(sources.length).toBe(2);

        eventNotifier.stop();
    });

    it('should reconnect after a goodbye frame', () => {
        const { eventNotifier, sources, last } = setup();

        eventNotifier.start();
        hello(last());
        emit(last(), 'Goodbye');

        expect(sources[0].closeCount).toBe(1);

        vi.advanceTimersByTime(RECONNECT_DELAY);

        expect(sources.length).toBe(2);

        eventNotifier.stop();
    });

    it('should back off on consecutive failures and reset the backoff once connected', () => {
        const { eventNotifier, sources, last } = setup();

        eventNotifier.start();

        // The first two reconnections are scheduled with the same fibonacci factor.
        for (let attempt = 1; attempt <= 2; attempt++) {
            last().onerror?.();
            vi.advanceTimersByTime(RECONNECT_DELAY);
            expect(sources.length).toBe(attempt + 1);
        }

        // The third one has to wait longer.
        last().onerror?.();
        vi.advanceTimersByTime(RECONNECT_DELAY);
        expect(sources.length).toBe(3);
        vi.advanceTimersByTime(RECONNECT_DELAY);
        expect(sources.length).toBe(4);

        // A connection that stays up long enough resets the backoff, so the next failure is
        // scheduled from the start of the curve again.
        hello(last());
        vi.advanceTimersByTime(INTERVAL_EVENT_TIMER);
        last().onerror?.();
        vi.advanceTimersByTime(RECONNECT_DELAY);
        expect(sources.length).toBe(5);

        eventNotifier.stop();
    });

    it('should give up once the whole backoff curve has been walked', () => {
        const { eventNotifier, sources, last, onError } = setup();

        eventNotifier.start();
        const attempts = exhaustReconnections({ sources, last });

        expect(attempts).toBe(FIBONACCI_LIST.length + 1);
        expect(getReportedErrors(onError)).toContain(GAVE_UP);

        // Nothing is retried any more, however long the tab stays open.
        last().onerror?.();
        vi.advanceTimersByTime(LONGEST_BACKOFF * 100);

        expect(sources.length).toBe(attempts);

        eventNotifier.stop();
    });

    it('should give up on a connection that keeps dropping right after greeting us', () => {
        const { eventNotifier, sources, last, onError } = setup();

        eventNotifier.start();

        // Being greeted must not hand back a fresh attempt budget every round, otherwise a
        // server that greets us and drops the stream is retried for the lifetime of the tab.
        for (let round = 0; round < 50; round++) {
            hello(last(), `connection-${round}`);
            last().onerror?.();
            vi.advanceTimersByTime(LONGEST_BACKOFF);
        }

        expect(sources.length).toBe(FIBONACCI_LIST.length + 1);
        expect(getReportedErrors(onError)).toContain(GAVE_UP);

        eventNotifier.stop();
    });

    it('should reset the backoff once a connection has stayed up long enough', () => {
        const { eventNotifier, sources, last } = setup();

        eventNotifier.start();

        // Two quick flaps advance the curve.
        for (let round = 0; round < 2; round++) {
            hello(last(), `connection-${round}`);
            last().onerror?.();
            vi.advanceTimersByTime(LONGEST_BACKOFF);
        }

        // This one lasts, which is what makes it count as healthy.
        hello(last(), 'connection-stable');
        vi.advanceTimersByTime(INTERVAL_EVENT_TIMER);

        // So the whole curve is available again from here.
        const stableAt = sources.length;
        expect(exhaustReconnections({ sources, last })).toBe(stableAt + FIBONACCI_LIST.length);

        eventNotifier.stop();
    });

    it('should resume after giving up when the network comes back', () => {
        const { eventNotifier, sources, last } = setup();

        eventNotifier.start();
        const attempts = exhaustReconnections({ sources, last });

        window.dispatchEvent(new Event('online'));

        expect(sources.length).toBe(attempts + 1);

        eventNotifier.stop();
    });

    it('should resume after giving up when the tab is focused again', () => {
        const { eventNotifier, sources, last, visibilityState } = setup();

        eventNotifier.start();
        const attempts = exhaustReconnections({ sources, last });

        visibilityState.triggerChange(true);

        expect(sources.length).toBe(attempts + 1);

        // The attempt count is reset, so the whole curve is available again.
        const resumedAt = sources.length;
        expect(exhaustReconnections({ sources, last })).toBe(resumedAt + FIBONACCI_LIST.length);

        eventNotifier.stop();
    });

    it('should reconnect with a backoff when the connection cannot be created', () => {
        const { eventNotifier, onError } = setup({ throwOnCreate: true });

        eventNotifier.start();

        expect(onError).toHaveBeenCalledWith('failed to open the connection', expect.any(Error));

        // Reconnecting keeps failing, but it never throws nor loops synchronously.
        vi.advanceTimersByTime(RECONNECT_DELAY);

        expect(onError).toHaveBeenCalledTimes(2);

        eventNotifier.stop();
    });

    it('should swallow a failing subscription', async () => {
        const error = new Error('nope');
        const api = createMockApi(async () => {
            throw error;
        });
        const { eventNotifier, onError, last } = setup({ api });

        eventNotifier.start();
        hello(last());
        await flushPromises();

        expect(onError).toHaveBeenCalledWith('failed to subscribe to the event loops', error);

        eventNotifier.stop();
    });

    it('should not report a subscription aborted by a reconnection as a failure', async () => {
        const { eventNotifier, onError, last } = setup({ api: createPendingApi() });

        eventNotifier.start();
        hello(last());
        // The subscription is still in flight when the connection drops.
        last().onerror?.();
        await flushPromises();

        expect(getReportedErrors(onError)).not.toContain('failed to subscribe to the event loops');
        // The drop itself is still worth reporting.
        expect(getReportedErrors(onError)).toContain('the connection dropped');

        eventNotifier.stop();
    });

    it('should not report a subscription aborted by stop as a failure', async () => {
        const { eventNotifier, onError, last } = setup({ api: createPendingApi() });

        eventNotifier.start();
        hello(last());
        eventNotifier.stop();
        await flushPromises();

        expect(getReportedErrors(onError)).toEqual([]);
    });

    it('should close the connection and stop reconnecting on stop', () => {
        const { eventNotifier, sources, last } = setup();

        eventNotifier.start();
        hello(last());
        eventNotifier.stop();

        expect(sources[0].closeCount).toBe(1);
        expect(sources[0].onerror).toBeNull();

        vi.advanceTimersByTime(RECONNECT_DELAY * 20);

        expect(sources.length).toBe(1);
    });

    it('should not reconnect after the connection drops once stopped', () => {
        const { eventNotifier, sources, last } = setup();

        eventNotifier.start();
        const source = last();
        eventNotifier.stop();
        source.onerror?.();

        vi.advanceTimersByTime(RECONNECT_DELAY * 20);

        expect(sources.length).toBe(1);
    });

    it('should reconnect immediately when the network comes back', () => {
        const { eventNotifier, sources } = setup();

        eventNotifier.start();
        window.dispatchEvent(new Event('offline'));

        expect(sources[0].closeCount).toBe(1);

        window.dispatchEvent(new Event('online'));

        expect(sources.length).toBe(2);

        eventNotifier.stop();
    });

    it('should stop listening to the network events on stop', () => {
        const { eventNotifier, sources } = setup();

        eventNotifier.start();
        eventNotifier.stop();
        window.dispatchEvent(new Event('online'));

        expect(sources.length).toBe(1);
    });

    it('should reconnect immediately when becoming visible again without a connection', () => {
        const { eventNotifier, sources, last, visibilityState } = setup();

        eventNotifier.start();
        last().onerror?.();
        visibilityState.triggerChange(false);
        visibilityState.triggerChange(true);

        expect(sources.length).toBe(2);

        // The pending backoff has been cleared, so no extra connection is opened.
        vi.advanceTimersByTime(RECONNECT_DELAY * 20);

        expect(sources.length).toBe(2);

        eventNotifier.stop();
    });

    it('should keep the connection when becoming visible again while connected', () => {
        const { eventNotifier, sources, last, visibilityState } = setup();

        eventNotifier.start();
        hello(last());
        visibilityState.triggerChange(true);

        expect(sources.length).toBe(1);
        expect(sources[0].closeCount).toBe(0);

        eventNotifier.stop();
    });
});
