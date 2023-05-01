import { useCallback } from 'react';

import { useApi, useCache, useCachedModelResult } from '@proton/components/hooks';
import { getPromiseValue } from '@proton/components/hooks/useCachedModelResult';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';
import { GetHolidaysDirectory } from '@proton/shared/lib/interfaces/hooks/GetHolidaysDirectory';
import { HolidaysCalendarsModel } from '@proton/shared/lib/models';

export const useGetHolidaysDirectory = (silence = false): GetHolidaysDirectory => {
    const normalApi = useApi();
    const api = silence ? getSilentApi(normalApi) : normalApi;
    const cache = useCache();
    return useCallback(() => {
        return getPromiseValue(cache, HolidaysCalendarsModel.key, () => HolidaysCalendarsModel.get(api));
    }, [cache, api]);
};
const useHolidaysDirectory = (silence = false): [HolidaysDirectoryCalendar[] | undefined, boolean, any] => {
    const cache = useCache();
    const miss = useGetHolidaysDirectory(silence);
    return useCachedModelResult(cache, HolidaysCalendarsModel.key, miss);
};
export default useHolidaysDirectory;
