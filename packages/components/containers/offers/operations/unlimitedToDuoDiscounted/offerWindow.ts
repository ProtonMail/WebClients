import { differenceInDays, fromUnixTime } from 'date-fns';

import { CYCLE } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';

type DayRange = [start: number, end: number];

const OFFER_WINDOWS: Partial<Record<CYCLE, DayRange[]>> = {
    [CYCLE.YEARLY]: [[305, 365]],
    [CYCLE.TWO_YEARS]: [
        [220, 280],
        [670, 730],
    ],
};

export const getDaysSincePeriodStart = (subscription: Subscription): number => {
    return differenceInDays(Date.now(), fromUnixTime(subscription.PeriodStart));
};

export const isInOfferWindow = (cycle: CYCLE | undefined, daysSincePeriodStart: number): boolean => {
    if (cycle === undefined) {
        return false;
    }

    const windows = OFFER_WINDOWS[cycle];

    if (!windows) {
        return false;
    }

    return windows.some(([start, end]) => {
        return daysSincePeriodStart >= start && daysSincePeriodStart <= end;
    });
};
