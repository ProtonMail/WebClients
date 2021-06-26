import { getPublicLinks } from '@proton/shared/lib/api/calendars';
import createCache from '@proton/shared/lib/helpers/cache';
import { CalendarUrlsResponse } from '@proton/shared/lib/interfaces/calendar';
import { useCallback } from 'react';
import useApi from './useApi';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';

export const KEY = 'CALENDAR_PUBLIC_LINKS';

export const useGetCalendarPublicLinks = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(
        (calendarID: string) => {
            if (!calendarID) {
                return Promise.resolve();
            }
            return api<CalendarUrlsResponse>(getPublicLinks(calendarID));
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
