import { useMemo } from 'react';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Api } from '@proton/shared/lib/interfaces';

import useApi from './useApi';

export const useSilentApi = (): Api => {
    const api = useApi();
    return useMemo(() => getSilentApi(api), [api]);
};
