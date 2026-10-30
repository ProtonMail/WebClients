import type { EventManagerIntervalTypes } from './eventManagerIntervals';

/**
 * What caused the event loop to be pulled. Only sent for analytics purposes.
 * - Timer: periodic polling
 * - Ping: the event notifier signaled that new events are available
 * - User: the user explicitly asked for a refresh
 * - Code: any other programmatic call
 */
export type EventLoopTrigger = 'Timer' | 'Ping' | 'User' | 'Code';

export interface EventLoopParams {
    CalledFrom: 'Foreground' | 'Background' | 'EncryptedSearch';
    Trigger: EventLoopTrigger;
}

export const getEventLoopParams = (context: {
    intervalType?: EventManagerIntervalTypes;
    source?: 'encrypted-search';
    trigger: EventLoopTrigger;
}): EventLoopParams => {
    let calledFrom: EventLoopParams['CalledFrom'] = 'Foreground';

    if (context.intervalType === 'foreground') {
        calledFrom = 'Foreground';
    } else if (context.intervalType === 'background') {
        calledFrom = 'Background';
    }
    // Encrypted search source doesn't really follow an interval type, so override it
    if (context.source === 'encrypted-search') {
        calledFrom = 'EncryptedSearch';
    }

    return {
        CalledFrom: calledFrom,
        Trigger: context.trigger,
    };
};
