import clamp from '@proton/utils/clamp';

import { INTERVAL_EVENT_TIMER } from '../constants';
import type { EventManagerIntervals } from './eventManagerIntervals';

const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value);
};

/**
 * Parses a `{ "foreground": number, "background": number }` flag payload, in milliseconds. Returns
 * undefined when it is missing or invalid, so that the caller falls back to its default.
 * The values are clamped between the classic interval and `max`, so that a misconfigured flag can
 * never make the event loop poll more often than it does without it.
 */
export const parseTimeoutIntervals = (payload: string | undefined, max: number): EventManagerIntervals | undefined => {
    if (!payload) {
        return;
    }

    let value: { foreground?: unknown; background?: unknown };
    try {
        value = JSON.parse(payload) ?? {};
    } catch {
        return;
    }

    // Ensure the values are in the correct order
    if (!isValidNumber(value.foreground) || !isValidNumber(value.background) || value.background < value.foreground) {
        return;
    }

    return {
        foreground: clamp(value.foreground, INTERVAL_EVENT_TIMER, max),
        background: clamp(value.background, INTERVAL_EVENT_TIMER, max),
    };
};
