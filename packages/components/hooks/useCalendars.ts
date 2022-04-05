import { useCallback } from 'react';
import { CalendarsModel } from '@proton/shared/lib/models/calendarsModel';
import { CalendarWithMembers } from '@proton/shared/lib/interfaces/calendar';
import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const useGetCalendars = (): (() => Promise<CalendarWithMembers[] | undefined>) => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => CalendarsModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, CalendarsModel.key, miss);
    }, [cache, miss]);
};

export const useCalendars = (): [CalendarWithMembers[] | undefined, boolean, any] => {
    const cache = useCache();
    const miss = useGetCalendars();
    return useCachedModelResult(cache, CalendarsModel.key, miss);
};

export default useCalendars;
