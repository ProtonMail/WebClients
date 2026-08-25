import { useEffect } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { useDebounceInput } from '@proton/components';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import noop from '@proton/utils/noop';

import { getAuthenticationMethod } from '../../../../../../api';
import type { ApiImporterAuthInfoResponse } from '../../../../../../api/api.interface';

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
