import { EventNotifierEventName, EventNotifierTransport } from './interface';

export interface EventNotifierConnectionHandlers {
    /** A frame, as its event name and its raw data, see `parseEventNotifierMessage`. */
    onMessage: (name: string, data: unknown) => void;
    /** The connection dropped or couldn't be established. Called at most once, and never after `close`. */
    onDrop: () => void;
}

export interface EventNotifierConnection {
    /** Closes the connection without calling any of its handlers any more. */
    close: () => void;
}

/**
 * Opens a connection to the event notifier, `url` already carrying the connection token. A transport
 * only moves frames: reconnecting, authenticating and subscribing are left to `EventNotifier`.
 */
export type OpenEventNotifierConnection = (
    url: string,
    handlers: EventNotifierConnectionHandlers
) => EventNotifierConnection;

export const openSseConnection: OpenEventNotifierConnection = (url, { onMessage, onDrop }) => {
    const source = new EventSource(url, { withCredentials: true });
    const names = Object.values(EventNotifierEventName);

    const handleEvent = (event: MessageEvent) => {
        onMessage(event.type, event.data);
    };

    const close = () => {
        // Detach the handlers before closing, otherwise the error it can raise while tearing down
        // would be reported as a drop.
        names.forEach((name) => source.removeEventListener(name, handleEvent));
        source.onerror = null;
        source.close();
    };

    names.forEach((name) => source.addEventListener(name, handleEvent));

    /**
     * `EventSource` reconnects on its own when the stream drops, but on a fixed interval that
     * every client shares, and it gives up for good on an HTTP error (a 401 for example).
     * Closing it here and leaving the reconnection to the caller instead gives a single jittered
     * backoff, and a new connection token, which the reconnection of `EventSource` couldn't get.
     */
    source.onerror = () => {
        close();
        onDrop();
    };

    return { close };
};

/** The WebSocket endpoint is the SSE one, under the matching `ws:`/`wss:` scheme. */
export const getWebSocketUrl = (url: string) => {
    const webSocketUrl = new URL(url);
    webSocketUrl.protocol = webSocketUrl.protocol === 'http:' ? 'ws:' : 'wss:';
    return webSocketUrl.toString();
};

/**
 * A WebSocket frame carries the same fields as an SSE one, as a JSON object: `{ "event": "Ping",
 * "data": … }`. The data is handed over as a string, the way `EventSource` does, so that both
 * transports share `parseEventNotifierMessage`. Malformed frames are dropped, like over SSE.
 */
export const parseWebSocketFrame = (raw: unknown): { event: string; data: unknown } | undefined => {
    if (typeof raw !== 'string') {
        return undefined;
    }
    try {
        const frame = JSON.parse(raw);
        if (!frame || typeof frame !== 'object' || typeof frame.event !== 'string') {
            return undefined;
        }
        const data =
            frame.data === undefined || typeof frame.data === 'string' ? frame.data : JSON.stringify(frame.data);
        return { event: frame.event, data };
    } catch (error) {
        return undefined;
    }
};

export const openWebSocketConnection: OpenEventNotifierConnection = (url, { onMessage, onDrop }) => {
    const socket = new WebSocket(getWebSocketUrl(url));

    const close = () => {
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
    };

    socket.onmessage = (event) => {
        const frame = parseWebSocketFrame(event.data);
        if (frame) {
            onMessage(frame.event, frame.data);
        }
    };

    // An error is always followed by a close, the first of the two to come is the drop.
    const handleDrop = () => {
        close();
        onDrop();
    };
    socket.onerror = handleDrop;
    socket.onclose = handleDrop;

    return { close };
};

export const openEventNotifierConnection: Record<EventNotifierTransport, OpenEventNotifierConnection> = {
    [EventNotifierTransport.Sse]: openSseConnection,
    [EventNotifierTransport.WebSocket]: openWebSocketConnection,
};
