import type { EventManagerIntervalTypes } from './eventManagerIntervals';

export interface EventLoopParams {
    CalledFrom: 'Foreground' | 'Background' | 'EncryptedSearch';
}

export const getEventLoopParams = (context: {
    intervalType?: EventManagerIntervalTypes;
    source?: 'encrypted-search';
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
    };
};
