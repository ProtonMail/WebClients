import type { VisibilityState } from '../../lib/eventManager/VisibilityState';
import { EventNotifier } from '../../lib/eventNotifier/EventNotifier';
import { EventNotifierLoopType, EventNotifierTransport } from '../../lib/eventNotifier/interface';
import {
    getWebSocketUrl,
    openSseConnection,
    openWebSocketConnection,
    parseWebSocketFrame,
} from '../../lib/eventNotifier/transports';
import type { Api } from '../../lib/interfaces/Api';

type Listener = (event: MessageEvent) => void;

class FakeEventSource {
    static instances: FakeEventSource[] = [];

    listeners: Record<string, Listener[]> = {};

    onerror: (() => void) | null = null;

    closeCount = 0;

    constructor(
        public url: string,
        public init?: EventSourceInit
    ) {
        FakeEventSource.instances.push(this);
    }

    addEventListener(name: string, listener: Listener) {
        this.listeners[name] = [...(this.listeners[name] ?? []), listener];
    }

    removeEventListener(name: string, listener: Listener) {
        this.listeners[name] = (this.listeners[name] ?? []).filter((item) => item !== listener);
    }

    close() {
        this.closeCount += 1;
    }

    /** Dispatches a frame the way `EventSource` does, as a named event carrying string data. */
    emit(name: string, data?: string) {
        (this.listeners[name] ?? []).forEach((listener) => listener({ type: name, data } as MessageEvent));
    }
}

class FakeWebSocket {
    static instances: FakeWebSocket[] = [];

    onmessage: ((event: MessageEvent) => void) | null = null;

    onerror: (() => void) | null = null;

    onclose: (() => void) | null = null;

    closeCount = 0;

    constructor(public url: string) {
        FakeWebSocket.instances.push(this);
    }

    close() {
        this.closeCount += 1;
    }

    send(frame: unknown) {
        this.onmessage?.({ data: typeof frame === 'string' ? frame : JSON.stringify(frame) } as MessageEvent);
    }
}

const setup = () => {
    const onMessage = vi.fn<(name: string, data: unknown) => void>();
    const onDrop = vi.fn<() => void>();
    return { onMessage, onDrop, handlers: { onMessage, onDrop } };
};

beforeEach(() => {
    FakeEventSource.instances = [];
    FakeWebSocket.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('SSE transport', () => {
    const URL = 'https://mail.proton.me/api/event-notifier/v1/events?ConnectionToken=token';

    it('should open the event source with the credentials', () => {
        openSseConnection(URL, setup().handlers);

        expect(FakeEventSource.instances[0].url).toBe(URL);
        expect(FakeEventSource.instances[0].init).toEqual({ withCredentials: true });
    });

    it('should forward the named events', () => {
        const { handlers, onMessage } = setup();
        openSseConnection(URL, handlers);

        FakeEventSource.instances[0].emit('Ping', '{"type":"mail"}');

        expect(onMessage).toHaveBeenCalledWith('Ping', '{"type":"mail"}');
    });

    it('should close itself on error instead of letting EventSource retry, and report the drop once', () => {
        const { handlers, onDrop } = setup();
        openSseConnection(URL, handlers);
        const source = FakeEventSource.instances[0];

        source.onerror?.();

        expect(source.closeCount).toBe(1);
        expect(source.onerror).toBeNull();
        expect(onDrop).toHaveBeenCalledTimes(1);
    });

    it('should not call its handlers any more once closed', () => {
        const { handlers, onMessage } = setup();
        const connection = openSseConnection(URL, handlers);
        const source = FakeEventSource.instances[0];

        connection.close();
        source.emit('Ping', '{"type":"mail"}');

        expect(source.closeCount).toBe(1);
        expect(source.onerror).toBeNull();
        expect(onMessage).not.toHaveBeenCalled();
    });
});

describe('WebSocket transport', () => {
    const URL = 'https://mail.proton.me/api/event-notifier/v1/events?ConnectionToken=token';

    it.each([
        {
            url: 'https://mail.proton.me/api/event-notifier/v1/events?ConnectionToken=a.b%2Bc',
            expected: 'wss://mail.proton.me/api/event-notifier/v1/events?ConnectionToken=a.b%2Bc',
        },
        {
            url: 'http://localhost:8080/api/event-notifier/v1/events?ConnectionToken=token',
            expected: 'ws://localhost:8080/api/event-notifier/v1/events?ConnectionToken=token',
        },
    ])('should connect to the SSE endpoint under the WebSocket scheme ($expected)', ({ url, expected }) => {
        expect(getWebSocketUrl(url)).toBe(expected);

        openWebSocketConnection(url, setup().handlers);

        expect(FakeWebSocket.instances[0].url).toBe(expected);
    });

    it('should forward frames with the data as a string, like over SSE', () => {
        const { handlers, onMessage } = setup();
        openWebSocketConnection(URL, handlers);
        const socket = FakeWebSocket.instances[0];

        socket.send({ event: 'Hello', data: { id: 'connection-1' } });
        socket.send({ event: 'Ping', data: '{"type":"mail"}' });
        socket.send({ event: 'Goodbye' });

        expect(onMessage.mock.calls).toEqual([
            ['Hello', '{"id":"connection-1"}'],
            ['Ping', '{"type":"mail"}'],
            ['Goodbye', undefined],
        ]);
    });

    it.each([
        { name: 'not json', frame: 'nope' },
        { name: 'not an object', frame: '42' },
        { name: 'null', frame: 'null' },
        { name: 'without an event', frame: '{"data":"x"}' },
        { name: 'binary', frame: new ArrayBuffer(1) },
    ])('should drop a malformed frame ($name)', ({ frame }) => {
        expect(parseWebSocketFrame(frame)).toBeUndefined();
    });

    it.each(['error', 'close'] as const)('should report the drop once on %s', (first) => {
        const { handlers, onDrop } = setup();
        openWebSocketConnection(URL, handlers);
        const socket = FakeWebSocket.instances[0];

        // An error is followed by a close, both must only count as one drop.
        if (first === 'error') {
            socket.onerror?.();
            socket.onclose?.();
        } else {
            socket.onclose?.();
            socket.onerror?.();
        }

        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(socket.closeCount).toBe(1);
        expect(socket.onclose).toBeNull();
    });

    it('should not call its handlers any more once closed', () => {
        const { handlers, onMessage, onDrop } = setup();
        const connection = openWebSocketConnection(URL, handlers);
        const socket = FakeWebSocket.instances[0];

        connection.close();
        socket.send({ event: 'Ping', data: { type: 'mail' } });

        expect(socket.closeCount).toBe(1);
        expect(socket.onmessage).toBeNull();
        expect(socket.onclose).toBeNull();
        expect(onMessage).not.toHaveBeenCalled();
        expect(onDrop).not.toHaveBeenCalled();
    });
});

describe.each([
    {
        transport: EventNotifierTransport.Sse,
        url: () => FakeEventSource.instances[0]?.url,
        frame: (name: string, data?: object) => FakeEventSource.instances[0].emit(name, data && JSON.stringify(data)),
        drop: () => FakeEventSource.instances[0].onerror?.(),
    },
    {
        transport: EventNotifierTransport.WebSocket,
        url: () => FakeWebSocket.instances[0]?.url,
        frame: (event: string, data?: object) => FakeWebSocket.instances[0].send({ event, data }),
        drop: () => FakeWebSocket.instances[0].onclose?.(),
    },
])('event notifier over $transport', ({ transport, url, frame, drop }) => {
    const flushPromises = async () => {
        for (let i = 0; i < 5; i++) {
            await Promise.resolve();
        }
    };

    const start = async () => {
        const api = vi.fn(async ({ url }: { url: string }) =>
            url === 'event-notifier/v1/connection-token' ? { ConnectionToken: { Token: 'token-1' } } : {}
        );
        const onPing = vi.fn();
        const onError = vi.fn();
        const eventNotifier = new EventNotifier({
            api: api as unknown as Api,
            url: 'https://mail.proton.me/api/event-notifier/v1/events',
            transport,
            loops: [{ Type: EventNotifierLoopType.Mail, Identifier: 'user-1' }],
            onPing,
            onError,
            visibilityState: { subscribe: () => () => {} } as unknown as VisibilityState,
        });
        eventNotifier.start();
        await flushPromises();
        return { eventNotifier, api, onPing, onError };
    };

    it('should connect with the token, subscribe on hello and notify the pings', async () => {
        const { eventNotifier, api, onPing } = await start();

        expect(new globalThis.URL(url()).searchParams.get('ConnectionToken')).toBe('token-1');

        frame('Hello', { id: 'connection-1' });
        frame('Ping', { type: 'mail', identifier: 'user-1' });

        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({ url: 'event-notifier/v1/connection/connection-1/loops' })
        );
        expect(onPing).toHaveBeenCalledWith({ type: EventNotifierLoopType.Mail, identifier: 'user-1' });

        eventNotifier.stop();
    });

    it('should report a drop', async () => {
        const { eventNotifier, onError } = await start();

        drop();

        expect(onError).toHaveBeenCalledWith('the connection dropped');

        eventNotifier.stop();
    });
});
