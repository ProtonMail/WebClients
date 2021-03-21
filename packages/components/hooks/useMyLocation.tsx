import { useCallback } from 'react';
import { Api, MyLocationResponse } from 'proton-shared/lib/interfaces';
import { getLocation } from 'proton-shared/lib/api/vpn';
import { noop } from 'proton-shared/lib/helpers/function';

import useCachedModelResult from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

const KEY = 'location';

const getMyLocationResponse = (api: Api) => {
    return api<MyLocationResponse>(getLocation()).catch(noop);
};

const useMyLocation = (): [MyLocationResponse | undefined, boolean, Error] => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getMyLocationResponse(api), [api]);
    return useCachedModelResult(cache, KEY, miss);
};

export default useMyLocation;
