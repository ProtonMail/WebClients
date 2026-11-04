import { INTERVAL_EVENT_TIMER } from '../constants';
import { EVENT_LOOP_INTERVAL_FLAG, getSharedUnleashClient } from '../unleash/sharedUnleashClient';
import type { EventManagerIntervals } from './eventManagerIntervals';
import { parseTimeoutIntervals } from './parseTimeoutIntervals';

export const getTimeoutIntervalsFromUnleash = (client = getSharedUnleashClient()): EventManagerIntervals => {
    try {
        if (client?.isEnabled(EVENT_LOOP_INTERVAL_FLAG)) {
            // Clamp the value between 30s and 300s to have some limitations
            const intervals = parseTimeoutIntervals(
                client.getVariant(EVENT_LOOP_INTERVAL_FLAG).payload?.value,
                INTERVAL_EVENT_TIMER * 10
            );
            if (intervals) {
                return intervals;
            }
        }
    } catch (error) {}

    return { foreground: INTERVAL_EVENT_TIMER, background: INTERVAL_EVENT_TIMER };
};
