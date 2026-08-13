import { useEffect } from 'react';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import noop from '@proton/utils/noop';

import useApi from './useApi';

export const useLoadAllowedTimeZones = () => {
    const api = useApi();
    useEffect(() => {
        const silentApi = getSilentApi(api);
        loadAllowedTimeZones(silentApi).catch(noop);
    }, []);
};
