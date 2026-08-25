import { useMemo } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Api } from '@proton/shared/lib/interfaces';

export const useSilentApi = (): Api => {
    const api = useApi();
    return useMemo(() => getSilentApi(api), [api]);
};
