import { FIBONACCI_LIST, INTERVAL_EVENT_TIMER } from '../constants';

/**
 * Event loops the event notifier can push notifications for. A client subscribes to the
 * subset of loops it actually consumes.
 */
export enum EventNotifierLoopType {
    Mail = 'mail',
    Calendar = 'calendar',
    Contacts = 'contacts',
    Core = 'core',
    Meet = 'meet',
    Lumo = 'lumo',
    Legacy = 'legacy',
}

/** Names of the SSE events pushed by the server. */
export enum EventNotifierEventName {
    Hello = 'Hello',
    Ping = 'Ping',
    Goodbye = 'Goodbye',
    Error = 'Error',
}

/**
 * Subscription entry sent to `POST event-notifier/v1/connection/{connectionID}/loops`.
 * `Identifier` identifies the loop: the user id for the user scoped loops, the calendar id for
 * the calendar model loops. It is echoed back by the server in the matching `Ping` messages.
 */
export interface EventNotifierLoop {
    Type: EventNotifierLoopType;
    Identifier: string;
}

export interface EventNotifierPing {
    type: EventNotifierLoopType;
    identifier?: string;
}

export type EventNotifierMessage =
    | { event: EventNotifierEventName.Hello; data: { id: string } }
    | { event: EventNotifierEventName.Ping; data: EventNotifierPing }
    | { event: EventNotifierEventName.Goodbye }
    | { event: EventNotifierEventName.Error; data: string };

/**
 * Base reconnection delay, multiplied by a fibonacci factor on consecutive failures. The longest
 * backoff it leads to stays in the range of the polling interval of the event loop, which is the
 * fallback when the connection is unavailable.
 */
export const RECONNECT_DELAY = 2000;

/** Random extra delay added to every reconnection so that clients don't all come back at once. */
export const RECONNECT_JITTER = 1000;

/**
 * The connection is given up on once the whole backoff curve has been walked, which takes about a
 * minute. A permanently failing connection (an expired session, the endpoint being disabled, a
 * proxy blocking SSE) then costs nothing for the rest of the lifetime of the tab, until something
 * suggests that retrying is worth it again: the network coming back, or the tab being focused.
 */
export const MAX_RECONNECT_ATTEMPTS = FIBONACCI_LIST.length;

/**
 * How long a connection has to stay up before the backoff is reset. Resetting as soon as the
 * server greets us would mean a connection that establishes and then immediately drops never
 * advances the curve, and so is retried for the lifetime of the tab instead of being given up on
 * (a proxy that doesn't handle streaming responses, a load balancer with a short response
 * timeout). Matching the polling interval makes the rule "a connection that outlives one poll
 * cycle is doing its job".
 */
export const STABLE_CONNECTION_DELAY = INTERVAL_EVENT_TIMER;
