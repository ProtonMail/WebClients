import { useCallback } from 'react';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useApi, useAuthentication } from '@proton/components';

import { resumePublicSession } from './resumePublicSession';

export const usePublicAuthSession = () => {
    const api = useApi();
    const authentication = useAuthentication();
    const getAddresses = useGetAddresses();

    const resumeSession = useCallback(async () => {
        await resumePublicSession({
            api,
            authentication,
            getAddresses,
        });
    }, [api, authentication, getAddresses]);

    return { resumeSession };
};
