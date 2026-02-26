import { useCallback } from 'react';

import { getKTActivation } from '@proton/account/kt/actions';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

/**
 * Return a KT verifier for when the state exists, i.e. we are inside the apps
 * and therefore self audit could run and the normal flow of verification can be performed
 */
const useKTVerifier = () => {
    const dispatch = useDispatch();
    const config = useConfig();
    const api = useApi();
    return useCallback(async () => {
        return createKTVerifier({ ktActivation: dispatch(getKTActivation()), config, api: getSilentApi(api) });
    }, []);
};

export default useKTVerifier;
