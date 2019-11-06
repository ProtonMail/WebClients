import { useCallback } from 'react';
import { getFullCalendar } from 'proton-shared/lib/api/calendars';
import useCache from '../containers/cache/useCache';
import useApi from '../containers/api/useApi';
import { getPromiseValue } from './useCachedModelResult';

export const KEY = 'CALENDAR_BOOTSTRAP';

export const useGetCalendarBootstrap = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback((calendarID) => api(getFullCalendar(calendarID)), [api]);

    return useCallback(
        (key) => {
            if (!cache.has(KEY)) {
                cache.set(KEY, new Map());
            }
            const subCache = cache.get(KEY);
            return getPromiseValue(subCache, key, miss);
        },
        [cache, miss]
    );
};

export default useGetCalendarBootstrap;
