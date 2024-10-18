import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { handleDriveCustomPassword } from '@proton/shared/lib/drive/sharing/publicDocsSharing';
import { getAuthHeaders } from '@proton/shared/lib/fetch/headers';

import { usePublicAuth, usePublicSession } from '../../store/_api';

export const usePublicDocsToken = () => {
    const { search, hash } = useLocation();

    const params = useMemo(() => new URLSearchParams(search), [search]);
    const token = params.get('token') || '';
    const urlPassword = hash.substring(1);

    const { isLoading, isPasswordNeeded, submitPassword, error, customPassword } = usePublicAuth(token, urlPassword);
    const { getSessionInfo } = usePublicSession();
    const [passwordError, setPasswordError] = useState<Error | null>(null);
    const isHandlingCustomPassword = useRef(false);

    const isError = !!error[0] || !!passwordError;
    const isReady = !isLoading && !isPasswordNeeded && !isError;

    useEffect(() => {
        if (isLoading || isError || !isPasswordNeeded) {
            return;
        }

        if (isHandlingCustomPassword.current) {
            return;
        }

        isHandlingCustomPassword.current = true;

        handleDriveCustomPassword({
            submitPassword,
            onError: (e) => {
                setPasswordError(e);
            },
        });
    }, [isLoading, isPasswordNeeded, isError, submitPassword, isHandlingCustomPassword]);

    return {
        isReady,
        isError,
        error: passwordError || (error[0] as Error),
        customPassword,
        token,
        urlPassword,
        getPublicAuthHeaders: () => {
            const sessionInfo = getSessionInfo();

            if (!sessionInfo) {
                throw new Error('No session info');
            }

            return getAuthHeaders(sessionInfo.sessionUid, sessionInfo.accessToken);
        },
    };
};
