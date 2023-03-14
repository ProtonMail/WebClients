import { useCallback } from 'react';

import { useApi, useCache, useCachedModelResult } from '@proton/components/hooks';
import { getPromiseValue } from '@proton/components/hooks/useCachedModelResult';
import { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';
import { HolidaysCalendarsModel } from '@proton/shared/lib/models';

const useGetHolidaysDirectory = () => {
    const api = useApi();
    const cache = useCache();
    return useCallback(() => {
        return getPromiseValue(cache, HolidaysCalendarsModel.key, () => HolidaysCalendarsModel.get(api));
    }, [cache, api]);
};
const useHolidaysDirectory = (): [HolidaysDirectoryCalendar[] | undefined, boolean, any] => {
    const cache = useCache();
    const miss = useGetHolidaysDirectory();
    return useCachedModelResult(cache, HolidaysCalendarsModel.key, miss);
};
export default useHolidaysDirectory;
