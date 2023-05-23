import { useCallback } from 'react';

import { getLocation } from '@proton/shared/lib/api/vpn';
import { Api, MyLocationResponse } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const KEY = 'location';

const getMyLocationResponse = (api: Api) => {
    return api<MyLocationResponse>(getLocation()).catch(noop);
};

/**
 * @deprecated Don't use VPN location API outside VPN context.
 *             To get country, use useMyCountry() instead.
 *             For other purpose, get dedicated API route from your BE team.
 */
const useMyLocation = (): [MyLocationResponse | undefined, boolean, Error] => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getMyLocationResponse(api), [api]);
    return useCachedModelResult(cache, KEY, miss);
};

export default useMyLocation;
