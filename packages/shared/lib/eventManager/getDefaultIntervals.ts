import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';
import { CommonFeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';
import clamp from '@proton/utils/clamp';

const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value);
};

export const getDefaultIntervals = (
    getClient = getStandaloneUnleashClient
): { foreground: number; background: number } => {
    try {
        const client = getClient();
        if (client && client.isEnabled(CommonFeatureFlag.EventLoopInterval)) {
            const variant = client.getVariant(CommonFeatureFlag.EventLoopInterval);
            const value: {
                foreground: unknown;
                background: unknown;
            } = variant.payload?.value ? JSON.parse(variant.payload.value) : undefined;
            if (isValidNumber(value.foreground) && isValidNumber(value.background)) {
                // Clamp the value between 30s and 300s to have some limitations
                return {
                    foreground: clamp(value.foreground, INTERVAL_EVENT_TIMER, INTERVAL_EVENT_TIMER * 10),
                    background: clamp(value.background, INTERVAL_EVENT_TIMER, INTERVAL_EVENT_TIMER * 10),
                };
            }
        }
    } catch (error) {}

    return { foreground: INTERVAL_EVENT_TIMER, background: INTERVAL_EVENT_TIMER };
};
