import { useCallback } from 'react';
import { CalendarUserSettingsModel } from '@proton/shared/lib/models/calendarSettingsModel';
import { CalendarUserSettings as tsCalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useCache from './useCache';
import useApi from './useApi';

export const useGetCalendarUserSettings = (): (() => Promise<tsCalendarUserSettings>) => {
    const api = useApi();
    const cache = useCache();
    return useCallback(() => {
        return getPromiseValue(cache, CalendarUserSettingsModel.key, () => CalendarUserSettingsModel.get(api));
    }, [cache, api]);
};

export const useCalendarUserSettings = (): [tsCalendarUserSettings, boolean, any] => {
    const cache = useCache();
    const miss = useGetCalendarUserSettings();
    return useCachedModelResult(cache, CalendarUserSettingsModel.key, miss);
};
