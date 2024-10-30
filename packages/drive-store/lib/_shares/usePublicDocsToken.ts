import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { getAuthHeaders } from '@proton/shared/lib/fetch/headers';

import { usePublicAuth, usePublicSession } from '../../store/_api';
import { getUrlPassword } from '../../utils/url/password';

export const usePublicDocsToken = () => {
    /**
     * Run this to update the window location hash value,
     * in case we are coming back from signup/signin and needing to get the hash from local storage.
     */
    getUrlPassword();

    const { search, hash } = useLocation();

    const params = useMemo(() => new URLSearchParams(search), [search]);
    const token = params.get('token') || '';
    const urlPassword = hash.substring(1);

    const { isLoading, isPasswordNeeded, submitPassword, error, customPassword } = usePublicAuth(token, urlPassword);
    const { getSessionInfo } = usePublicSession();

    const isError = !!error[0];
    const isReady = !isLoading && !isPasswordNeeded && !isError;

    return {
        isReady,
        isError,
        error: error[0] as Error,
        customPassword,
        token,
        urlPassword,
        isPasswordNeeded,
        submitPassword,
        getPublicAuthHeaders: () => {
            const sessionInfo = getSessionInfo();

            if (!sessionInfo) {
                throw new Error('No session info');
            }

            return getAuthHeaders(sessionInfo.sessionUid, sessionInfo.accessToken);
        },
    };
};
