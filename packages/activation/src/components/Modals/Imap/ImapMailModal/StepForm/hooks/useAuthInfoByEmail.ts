import { useEffect } from 'react';

import { getAuthenticationMethod } from '@proton/activation/src/api';
import type { ApiImporterAuthInfoResponse } from '@proton/activation/src/api/api.interface';
import { useDebounceInput } from '@proton/components';
import { useApi } from '@proton/components/hooks';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import noop from '@proton/utils/noop';

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
        })
            .then((result) => {
                onInfosLoaded(result);
            })
            .catch(noop);

        return () => {
            abortController.abort();
        };
    }, [debouncedEmail]);
};

export default useAuthInfoByEmail;
