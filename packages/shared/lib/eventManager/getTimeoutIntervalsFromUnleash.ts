import { CommonFeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';
import clamp from '@proton/utils/clamp';

import { INTERVAL_EVENT_TIMER } from '../constants';
import type { EventManagerIntervals } from './eventManagerIntervals';

const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value);
};

export const getTimeoutIntervalsFromUnleash = (client = getStandaloneUnleashClient()): EventManagerIntervals => {
    try {
        if (client?.isEnabled(CommonFeatureFlag.EventLoopInterval)) {
            const variant = client.getVariant(CommonFeatureFlag.EventLoopInterval);
            const value: {
                foreground: unknown;
                background: unknown;
            } = variant.payload?.value ? JSON.parse(variant.payload.value) : {};
            if (isValidNumber(value.foreground) && isValidNumber(value.background)) {
                // Ensure the values are in the correct order
                if (value.background >= value.foreground) {
                    // Clamp the value between 30s and 300s to have some limitations
                    return {
                        foreground: clamp(value.foreground, INTERVAL_EVENT_TIMER, INTERVAL_EVENT_TIMER * 10),
                        background: clamp(value.background, INTERVAL_EVENT_TIMER, INTERVAL_EVENT_TIMER * 10),
                    };
                }
            }
        }
    } catch (error) {}

    return { foreground: INTERVAL_EVENT_TIMER, background: INTERVAL_EVENT_TIMER };
};
