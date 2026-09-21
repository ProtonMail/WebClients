import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { subscribeToEventNotifierLoops } from '../api/eventNotifier';
import { FIBONACCI_LIST } from '../constants';
import { type VisibilityState, getVisibilityStateSingleton } from '../eventManager/VisibilityState';
import { SentryCommonInitiatives, captureInitiativeMessage } from '../helpers/sentry';
import type { Api } from '../interfaces';
import {
    EventNotifierEventName,
    type EventNotifierLoop,
    type EventNotifierPing,
    MAX_RECONNECT_ATTEMPTS,
    RECONNECT_DELAY,
    RECONNECT_JITTER,
    STABLE_CONNECTION_DELAY,
} from './interface';
import { parseEventNotifierMessage } from './parseEventNotifierMessage';

interface EventNotifierConfig {
    api: Api;
    /** SSE url, see `getEventNotifierUrl`. */
    url: string;
    /** Loops to subscribe to. A ping is received for each of them, even when there is no new event. */
    loops: EventNotifierLoop[];
    onPing: (ping: EventNotifierPing) => void;
    /** Errors are never actionable for the user, this is only meant for logging. */
    onError?: (message: string, error?: unknown) => void;
    visibilityState?: VisibilityState;
}

/**
 * The event notifier ("Ping-o-matic"): it keeps an SSE connection open to the API and notifies the
 * caller as soon as the server signals that new events are available, so that the event loop can
 * be called without waiting for its next poll.
 *
 * The connection is purely an optimisation. Anything going wrong with it is swallowed and only
 * leads to the event loop keeping its regular polling interval, which is why nothing here is
 * surfaced to the user.
 */
export class EventNotifier {
    private readonly api: Api;

    /** Protected so that an override of `createEventSource` can reach it. */
    protected readonly url: string;

    private readonly loops: EventNotifierLoop[];

    private readonly onPing: (ping: EventNotifierPing) => void;

    private readonly onError: (message: string, error?: unknown) => void;

    private readonly visibilityState: VisibilityState;

    private source: EventSource | undefined;

    private reconnectHandle: ReturnType<typeof setTimeout> | undefined;

    private stableConnectionHandle: ReturnType<typeof setTimeout> | undefined;

    private subscribeAbortController: AbortController | undefined;

    private unsubscribeVisibilityState: (() => void) | undefined;

    private retryIndex = 0;

    private started = false;

    constructor({
        api,
        url,
        loops,
        onPing,
        onError = noop,
        visibilityState = getVisibilityStateSingleton(),
    }: EventNotifierConfig) {
        this.api = api;
        this.url = url;
        this.loops = loops;
        this.onPing = onPing;
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
        this.connect();
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
    protected createEventSource(): EventSource {
        return new EventSource(this.url, { withCredentials: true });
    }

    private connect() {
        if (!this.started || this.source) {
            return;
        }

        try {
            this.source = this.createEventSource();
        } catch (error) {
            this.onError('failed to open the connection', error);
            this.reconnect();
            return;
        }

        Object.values(EventNotifierEventName).forEach((name) => this.source?.addEventListener(name, this.handleEvent));

        /**
         * `EventSource` reconnects on its own when the stream drops, but on a fixed interval that
         * every client shares, and it gives up for good on an HTTP error (a 401 for example).
         * Closing it here and driving the reconnection instead gives a single jittered backoff.
         */
        this.source.onerror = () => {
            this.onError('the connection dropped');
            this.reconnect();
        };
    }

    private closeConnection() {
        this.clearStableConnection();
        this.subscribeAbortController?.abort();
        this.subscribeAbortController = undefined;

        if (!this.source) {
            return;
        }

        // Detach the handlers before closing, otherwise the error it can raise while tearing down
        // would schedule another reconnection.
        Object.values(EventNotifierEventName).forEach((name) =>
            this.source?.removeEventListener(name, this.handleEvent)
        );
        this.source.onerror = null;
        this.source.close();
        this.source = undefined;
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
            this.connect();
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
        this.connect();
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
        }
    }

    /*
     * The handlers below are arrow properties on purpose: they are handed to `addEventListener`
     * and to the visibility state, which need the very same reference back to detach them.
     */

    private handleEvent = (event: MessageEvent) => {
        const message = parseEventNotifierMessage(event.type, event.data);

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
        if (visible && !this.source) {
            this.reconnectNow();
        }
    };
}
