import { useEffect } from 'react';

import { getAuthenticationMethod } from '@proton/activation/api';
import { ApiImporterAuthInfoResponse } from '@proton/activation/api/api.interface';
import { useDebounceInput } from '@proton/components/components';
import { useApi } from '@proton/components/hooks';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

/**
 * Fetches auth method for a given email address
 */
const useAuthInfoByEmail = (email: string, onInfosLoaded: (result: ApiImporterAuthInfoResponse) => void) => {
    const debouncedEmail = useDebounceInput(email, 150);
    const api = useApi();

    useEffect(() => {
        if (!email || !validateEmailAddress(debouncedEmail)) {
            return;
        }

        const abortController = new AbortController();

        void api<ApiImporterAuthInfoResponse>({
            ...getAuthenticationMethod({ Email: email }),
            signal: abortController.signal,
        }).then((result) => {
            onInfosLoaded(result);
        });

        return () => {
            abortController.abort();
        };
    }, [debouncedEmail]);
};

export default useAuthInfoByEmail;
