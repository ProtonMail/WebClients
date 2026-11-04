import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { getEventNotifierConnectionToken, subscribeToEventNotifierLoops } from '../api/eventNotifier';
import { FIBONACCI_LIST } from '../constants';
import { type VisibilityState, getVisibilityStateSingleton } from '../eventManager/VisibilityState';
import { SentryCommonInitiatives, captureInitiativeMessage } from '../helpers/sentry';
import type { Api } from '../interfaces/Api';
import { getEventNotifierConnectionUrl } from './getEventNotifierUrl';
import {
    EventNotifierEventName,
    type EventNotifierLoop,
    type EventNotifierPing,
    EventNotifierTransport,
    MAX_RECONNECT_ATTEMPTS,
    RECONNECT_DELAY,
    RECONNECT_JITTER,
    STABLE_CONNECTION_DELAY,
} from './interface';
import { parseEventNotifierMessage } from './parseEventNotifierMessage';
import {
    type EventNotifierConnection,
    type EventNotifierConnectionHandlers,
    openEventNotifierConnection,
} from './transports';

interface EventNotifierConfig {
    api: Api;
    /** See `getEventNotifierUrl`, the same url serves every transport. */
    url: string;
    /** Defaults to SSE. */
    transport?: EventNotifierTransport;
    /** Loops to subscribe to. A ping is received for each of them, even when there is no new event. */
    loops: EventNotifierLoop[];
    onPing: (ping: EventNotifierPing) => void;
    /**
     * Called with true once pings can be received, i.e. the connection is open and the loops are
     * subscribed, and with false as soon as that stops being the case. Pings only replace polling
     * while this is true.
     */
    onPingChannelChange?: (active: boolean) => void;
    /** Errors are never actionable for the user, this is only meant for logging. */
    onError?: (message: string, error?: unknown) => void;
    visibilityState?: VisibilityState;
}

/**
 * The event notifier ("Ping-o-matic"): it keeps a connection open to the API and notifies the
 * caller as soon as the server signals that new events are available, so that the event loop can
 * be called without waiting for its next poll.
 *
 * The connection is purely an optimisation. Anything going wrong with it is swallowed and only
 * leads to the event loop keeping its regular polling interval, which is why nothing here is
 * surfaced to the user.
 */
export class EventNotifier {
    private readonly api: Api;

    private readonly url: string;

    private readonly transport: EventNotifierTransport;

    private readonly loops: EventNotifierLoop[];

    private readonly onPing: (ping: EventNotifierPing) => void;

    private readonly onPingChannelChange: (active: boolean) => void;

    private readonly onError: (message: string, error?: unknown) => void;

    private readonly visibilityState: VisibilityState;

    private connection: EventNotifierConnection | undefined;

    private reconnectHandle: ReturnType<typeof setTimeout> | undefined;

    private stableConnectionHandle: ReturnType<typeof setTimeout> | undefined;

    /** Set while the connection token is being fetched, before the connection itself is opened. */
    private connectAbortController: AbortController | undefined;

    private subscribeAbortController: AbortController | undefined;

    private unsubscribeVisibilityState: (() => void) | undefined;

    private retryIndex = 0;

    private pingChannelActive = false;

    private started = false;

    constructor({
        api,
        url,
        transport = EventNotifierTransport.Sse,
        loops,
        onPing,
        onPingChannelChange = noop,
        onError = noop,
        visibilityState = getVisibilityStateSingleton(),
    }: EventNotifierConfig) {
        this.api = api;
        this.url = url;
        this.transport = transport;
        this.loops = loops;
        this.onPing = onPing;
        this.onPingChannelChange = onPingChannelChange;
        this.onError = onError;
        this.visibilityState = visibilityState;
    }

    start() {
        if (this.started) {
            return;
        }

        this.started = true;
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        this.unsubscribeVisibilityState = this.visibilityState.subscribe(this.handleVisibilityChange);
        void this.connect();
    }

    stop() {
        if (!this.started) {
            return;
        }

        this.started = false;
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        this.unsubscribeVisibilityState?.();
        this.unsubscribeVisibilityState = undefined;
        this.clearReconnect();
        this.closeConnection();
        this.retryIndex = 0;
    }

    /**
     * Seam for the tests to drive the state machine without a network. Overriding this is the only
     * supported way to substitute the connection, which is why it isn't part of the config.
     */
    protected openConnection(url: string, handlers: EventNotifierConnectionHandlers): EventNotifierConnection {
        return openEventNotifierConnection[this.transport](url, handlers);
    }

    /** Whether a connection is open, or about to be while its connection token is being fetched. */
    private hasConnection() {
        return !!this.connection || !!this.connectAbortController;
    }

    /**
     * A fresh connection token is fetched for every attempt: it is only valid for 2 minutes, so one
     * kept from a previous attempt is likely expired after a sleep or a long backoff. This is also
     * what recovers from the server rejecting a token, as the retry comes with a new one.
     */
    private async connect() {
        if (!this.started || this.hasConnection()) {
            return;
        }

        const abortController = new AbortController();
        this.connectAbortController = abortController;

        let connectionToken: string;
        try {
            const { ConnectionToken } = await this.api<{ ConnectionToken?: { Token?: unknown } }>({
                ...getEventNotifierConnectionToken(),
                signal: abortController.signal,
                silence: true,
            });
            const token = ConnectionToken?.Token;
            if (typeof token !== 'string' || !token) {
                throw new Error('missing connection token');
            }
            connectionToken = token;
        } catch (error) {
            // Aborted by a teardown, which has already taken care of what comes next.
            if (abortController.signal.aborted) {
                return;
            }
            this.connectAbortController = undefined;
            this.onError('failed to fetch a connection token', error);
            this.reconnect();
            return;
        }

        if (abortController.signal.aborted) {
            return;
        }
        this.connectAbortController = undefined;

        try {
            this.connection = this.openConnection(getEventNotifierConnectionUrl(this.url, connectionToken), {
                onMessage: this.handleMessage,
                onDrop: this.handleDrop,
            });
        } catch (error) {
            this.onError('failed to open the connection', error);
            this.reconnect();
        }
    }

    private closeConnection() {
        this.clearStableConnection();
        this.connectAbortController?.abort();
        this.connectAbortController = undefined;
        this.subscribeAbortController?.abort();
        this.subscribeAbortController = undefined;

        this.connection?.close();
        this.connection = undefined;

        this.setPingChannelActive(false);
    }

    private setPingChannelActive(active: boolean) {
        if (this.pingChannelActive === active) {
            return;
        }
        this.pingChannelActive = active;
        this.onPingChannelChange(active);
    }

    /** Closes the current connection, if any, and schedules a new one with a backoff. */
    private reconnect() {
        this.closeConnection();
        this.clearReconnect();

        if (!this.started) {
            return;
        }

        if (this.retryIndex >= MAX_RECONNECT_ATTEMPTS) {
            this.onError('giving up on the connection after too many failed attempts');
            return;
        }

        const delay = this.getReconnectDelay();
        this.retryIndex += 1;
        this.reconnectHandle = setTimeout(() => {
            this.reconnectHandle = undefined;
            void this.connect();
        }, delay);
    }

    /**
     * Reconnects immediately, for cases where the connection is expected to succeed again. This is
     * also what resumes a connection that has been given up on, by resetting the attempt count.
     */
    private reconnectNow() {
        if (!this.started) {
            return;
        }
        this.closeConnection();
        this.clearReconnect();
        this.retryIndex = 0;
        void this.connect();
    }

    private getReconnectDelay() {
        const factor = FIBONACCI_LIST[Math.min(this.retryIndex, FIBONACCI_LIST.length - 1)];
        return RECONNECT_DELAY * factor + randomIntFromInterval(0, RECONNECT_JITTER);
    }

    private clearReconnect() {
        if (this.reconnectHandle !== undefined) {
            clearTimeout(this.reconnectHandle);
            this.reconnectHandle = undefined;
        }
    }

    private clearStableConnection() {
        if (this.stableConnectionHandle !== undefined) {
            clearTimeout(this.stableConnectionHandle);
            this.stableConnectionHandle = undefined;
        }
    }

    private async subscribeToLoops(connectionID: string) {
        const abortController = new AbortController();
        this.subscribeAbortController = abortController;

        try {
            await this.api({
                ...subscribeToEventNotifierLoops(connectionID, this.loops),
                signal: abortController.signal,
                silence: true,
            });
        } catch (error) {
            // Tearing the connection down aborts this request on purpose: the connection id it
            // subscribes is already stale, so it isn't a failure worth reporting.
            if (abortController.signal.aborted) {
                return;
            }
            // Without a subscription no ping is received, which the regular polling covers.
            this.onError('failed to subscribe to the event loops', error);
            return;
        }

        if (!abortController.signal.aborted) {
            this.setPingChannelActive(true);
        }
    }

    /*
     * The handlers below are arrow properties on purpose: they are handed to `addEventListener`,
     * to the visibility state and to the connection, without being bound.
     */

    private handleMessage = (name: string, data: unknown) => {
        const message = parseEventNotifierMessage(name, data);

        if (!message) {
            return;
        }

        switch (message.event) {
            case EventNotifierEventName.Hello: {
                // Being greeted only proves the connection opened, not that it can stay up, so
                // the backoff is reset later, once it has lasted long enough to count as healthy.
                this.clearStableConnection();
                this.stableConnectionHandle = setTimeout(() => {
                    this.stableConnectionHandle = undefined;
                    this.retryIndex = 0;
                }, STABLE_CONNECTION_DELAY);
                void this.subscribeToLoops(message.data.id);
                break;
            }
            case EventNotifierEventName.Ping: {
                this.onPing(message.data);
                break;
            }
            case EventNotifierEventName.Goodbye: {
                this.reconnect();
                break;
            }
            case EventNotifierEventName.Error: {
                this.onError(`server error: ${message.data}`);
                captureInitiativeMessage(SentryCommonInitiatives.EVENT_NOTIFIER, `Event notifier: server error`, {
                    level: 'warning',
                    extra: { error: message.data },
                });
                break;
            }
        }
    };

    private handleDrop = () => {
        this.onError('the connection dropped');
        this.reconnect();
    };

    private handleOnline = () => {
        this.reconnectNow();
    };

    private handleOffline = () => {
        // Not `reconnectNow`, connecting can only fail until the network is back. The backoff is
        // kept as a safety net in case the `online` event never comes.
        if (this.started) {
            this.reconnect();
        }
    };

    private handleVisibilityChange = (visible: boolean) => {
        // A connection can have died silently, e.g. after the device woke up from sleep. Becoming
        // visible is a good moment to retry without waiting for the backoff to elapse.
        if (visible && !this.hasConnection()) {
            this.reconnectNow();
        }
    };
}
