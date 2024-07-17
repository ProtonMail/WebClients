import { useCallback } from 'react';

import { getFullCalendar } from '@proton/shared/lib/api/calendars';
import createCache from '@proton/shared/lib/helpers/cache';
import { CalendarBootstrap } from '@proton/shared/lib/interfaces/calendar';
import { STATUS } from '@proton/shared/lib/models/cache';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const KEY = 'CALENDAR_BOOTSTRAP';

type GetCalendarBootstrap = {
    (calendarID?: undefined): Promise<undefined>;
    (calendarID: string): Promise<CalendarBootstrap>;
};

export const useGetCalendarBootstrap: () => GetCalendarBootstrap = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(
        (calendarID: string) => {
            if (!calendarID) {
                return Promise.reject(new Error('Missing calendar ID'));
            }
            return api(getFullCalendar(calendarID));
        },
        [api]
    );

    return useCallback(
        (calendarID?: string) => {
            if (!cache.has(KEY)) {
                cache.set(KEY, createCache());
            }
            if (!calendarID) {
                return Promise.resolve(undefined);
            }
            return getPromiseValue(cache.get(KEY), calendarID, miss);
        },
        [cache, miss]
    );
};

export const useReadCalendarBootstrap = () => {
    const cache = useCache();
    return useCallback(
        (calendarID: string) => {
            if (!cache.has(KEY)) {
                cache.set(KEY, createCache());
            }
            const oldRecord = cache.get(KEY).get(calendarID);
            if (!oldRecord || oldRecord.status !== STATUS.RESOLVED) {
                return;
            }
            return oldRecord.value;
        },
        [cache]
    );
};

export const useCalendarBootstrap = (calendarID?: string) => {
    const cache = useCache();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    if (!cache.has(KEY)) {
        cache.set(KEY, createCache());
    }
    return useCachedModelResult(cache.get(KEY), calendarID, getCalendarBootstrap);
};

export default useGetCalendarBootstrap;
