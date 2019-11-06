import { useCallback } from 'react';
import { CalendarsModel } from 'proton-shared/lib/models/calendarsModel';
import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const useGetCalendars = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => CalendarsModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, CalendarsModel.key, miss);
    }, [cache, miss]);
};

export const useCalendars = () => {
    const cache = useCache();
    const miss = useGetCalendars();
    return useCachedModelResult(cache, CalendarsModel.key, miss);
};
