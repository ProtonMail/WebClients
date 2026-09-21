import type { EventNotifierLoop } from '../eventNotifier/interface';

export const EVENT_NOTIFIER_EVENTS_URL = 'event-notifier/v1/events';

export const subscribeToEventNotifierLoops = (
    connectionID: string,
    add: EventNotifierLoop[] = [],
    remove: EventNotifierLoop[] = []
) => ({
    method: 'post',
    url: `event-notifier/v1/connection/${encodeURIComponent(connectionID)}/loops`,
    data: { Add: add, Remove: remove },
});
