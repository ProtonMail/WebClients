import { useCallback } from 'react';

import { CalendarSubscriptionResponse } from 'proton-shared/lib/interfaces/calendar';
import { getSubscriptionParameters } from 'proton-shared/lib/api/calendars';
import createCache from 'proton-shared/lib/helpers/cache';

import { getPromiseValue } from './useCachedModelResult';
import { useApi, useCache } from './index';

export const KEY = 'CALENDAR_SUBSCRIPTION';

export const useGetCalendarSubscription = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(
        (calendarID: string) => {
            if (!calendarID) {
                return Promise.resolve();
            }
            return api<CalendarSubscriptionResponse>(getSubscriptionParameters(calendarID));
        },
        [api]
    );

    return useCallback(
        (calendarID: string) => {
            if (!cache.has(KEY)) {
                cache.set(KEY, createCache());
            }
            return getPromiseValue(cache.get(KEY), calendarID, miss);
        },
        [cache, miss]
    );
};
