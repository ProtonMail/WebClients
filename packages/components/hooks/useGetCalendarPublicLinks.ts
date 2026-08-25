import { useCallback } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { useCache } from '@proton/app-context/useCache';
import { getPublicLinks } from '@proton/shared/lib/api/calendars';
import createCache from '@proton/shared/lib/helpers/cache';
import type { CalendarUrlsResponse } from '@proton/shared/lib/interfaces/calendar';
import { getPromiseValue } from '@proton/shared/lib/models/cache';

export const KEY = 'CALENDAR_PUBLIC_LINKS';

export const useGetCalendarPublicLinks = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(
        (calendarID: string): Promise<CalendarUrlsResponse> => {
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
