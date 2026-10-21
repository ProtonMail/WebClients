import { useCallback } from 'react';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useApi } from '@proton/app-context/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';

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
