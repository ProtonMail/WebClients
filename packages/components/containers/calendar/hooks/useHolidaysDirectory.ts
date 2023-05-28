import { useCallback } from 'react';

import { useApi, useCache, useCachedModelResult } from '@proton/components/hooks';
import { getPromiseValue } from '@proton/components/hooks/useCachedModelResult';
import { Api } from '@proton/shared/lib/interfaces';
import { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';
import { GetHolidaysDirectory } from '@proton/shared/lib/interfaces/hooks/GetHolidaysDirectory';
import { HolidaysCalendarsModel } from '@proton/shared/lib/models';

export const useGetHolidaysDirectory = (inputApi?: Api): GetHolidaysDirectory => {
    const normalApi = useApi();
    const api = inputApi || normalApi;
    const cache = useCache();
    return useCallback(() => {
        return getPromiseValue(cache, HolidaysCalendarsModel.key, () => HolidaysCalendarsModel.get(api));
    }, [cache, api]);
};
const useHolidaysDirectory = (api?: Api): [HolidaysDirectoryCalendar[] | undefined, boolean, any] => {
    const cache = useCache();
    const miss = useGetHolidaysDirectory(api);
    return useCachedModelResult(cache, HolidaysCalendarsModel.key, miss);
};
export default useHolidaysDirectory;
