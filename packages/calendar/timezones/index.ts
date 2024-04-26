import { useEffect } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import noop from '@proton/utils/noop';

export const useLoadAllowedTimeZones = () => {
    const api = useApi();
    useEffect(() => {
        const silentApi = getSilentApi(api);
        loadAllowedTimeZones(silentApi).catch(noop);
    }, []);
};
