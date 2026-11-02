import type { EventNotifierLoop } from '../eventNotifier/interface';

export const EVENT_NOTIFIER_EVENTS_URL = 'event-notifier/v1/events';

/**
 * Short lived (2 minutes) token authenticating the SSE connection, since `EventSource` cannot send
 * the session headers. It is meant to be exchanged for a connection right away.
 */
export const getEventNotifierConnectionToken = () => ({
    method: 'post',
    url: 'event-notifier/v1/connection-token',
});

export const subscribeToEventNotifierLoops = (
    connectionID: string,
    add: EventNotifierLoop[] = [],
    remove: EventNotifierLoop[] = []
) => ({
    method: 'post',
    url: `event-notifier/v1/connection/${encodeURIComponent(connectionID)}/loops`,
    data: { Add: add, Remove: remove },
});
