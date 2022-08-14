import { useCallback } from 'react';

import { CalendarUserSettings as tsCalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { CalendarUserSettingsModel } from '@proton/shared/lib/models/calendarSettingsModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

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
