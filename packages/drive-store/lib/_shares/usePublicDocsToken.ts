import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { handleDriveCustomPassword } from '@proton/shared/lib/drive/sharing/publicDocsSharing';
import { getAuthHeaders } from '@proton/shared/lib/fetch/headers';

import { usePublicAuth, usePublicSession } from '../../store/_api';

export const usePublicDocsToken = () => {
    const { search, hash } = useLocation();

    const params = useMemo(() => new URLSearchParams(search), [search]);
    const token = params.get('token') || '';
    const urlPassword = hash.substring(1);

    const { isLoading, isPasswordNeeded, submitPassword, error } = usePublicAuth(token, urlPassword);
    const { getSessionInfo } = usePublicSession();
    const [isPasswordError, setIsPasswordError] = useState<boolean>(false);

    const isError = !!error[0] || isPasswordError;
    const isReady = !isLoading && !isPasswordNeeded && !isError;

    useEffect(() => {
        if (isLoading || isError || !isPasswordNeeded) {
            return;
        }

        handleDriveCustomPassword({
            submitPassword,
            onError: () => {
                setIsPasswordError(true);
            },
        });
    }, [isLoading, isPasswordNeeded, isError]);

    return {
        isReady,
        isError,
        getPublicAuthHeaders: () => {
            const sessionInfo = getSessionInfo();

            if (!sessionInfo) {
                throw new Error('No session info');
            }

            return getAuthHeaders(sessionInfo.sessionUid, sessionInfo.accessToken);
        },
    };
};
