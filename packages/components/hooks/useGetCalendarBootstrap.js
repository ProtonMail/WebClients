import { useCallback } from 'react';
import { getFullCalendar } from 'proton-shared/lib/api/calendars';
import createCache from 'proton-shared/lib/helpers/cache';
import useCache from '../containers/cache/useCache';
import useApi from '../containers/api/useApi';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const KEY = 'CALENDAR_BOOTSTRAP';

export const useGetCalendarBootstrap = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(
        (calendarID) => {
            if (!calendarID) {
                return Promise.resolve();
            }
            return api(getFullCalendar(calendarID));
        },
        [api]
    );

    return useCallback(
        (key) => {
            if (!cache.has(KEY)) {
                cache.set(KEY, createCache());
            }
            return getPromiseValue(cache.get(KEY), key, miss);
        },
        [cache, miss]
    );
};

export const useCalendarBootstrap = (calendarID) => {
    const cache = useCache();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    if (!cache.has(KEY)) {
        cache.set(KEY, createCache());
    }
    return useCachedModelResult(cache.get(KEY), calendarID, getCalendarBootstrap);
};
