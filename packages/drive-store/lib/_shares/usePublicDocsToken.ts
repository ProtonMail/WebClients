import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { receiveCustomPasswordFromDriveWindow } from '@proton/shared/lib/drive/sharing/publicDocsSharing';
import { getAuthHeaders } from '@proton/shared/lib/fetch/headers';

import { usePublicAuth, usePublicSession } from '../../store/_api';
import { getUrlPassword } from '../../utils/url/password';

export const usePublicDocsToken = (session?: ResumedSessionResult) => {
    /**
     * Run this to update the window location hash value,
     * in case we are coming back from signup/signin and needing to get the hash from local storage.
     */
    getUrlPassword();

    const { search, hash } = useLocation();

    const params = useMemo(() => new URLSearchParams(search), [search]);
    const token = params.get('token') || '';
    const linkIdParam = params.get('linkId') || undefined;
    const urlPassword = hash.substring(1);

    const { isLoading, isPasswordNeeded, submitPassword, error, customPassword } = usePublicAuth(
        token,
        urlPassword,
        session
    );
    const { getSessionInfo } = usePublicSession();

    const isHandlingCustomPassword = useRef(false);
    const [isWaitingForPasswordFromDriveWindow, setIsWaitingForPassword] = useState(false);

    const isError = !!error[0];

    const isReady = !isLoading && !isPasswordNeeded && !isError;

    useEffect(() => {
        if (isLoading || isError || !isPasswordNeeded) {
            return;
        }

        if (isHandlingCustomPassword.current) {
            return;
        }

        isHandlingCustomPassword.current = true;
        setIsWaitingForPassword(true);

        receiveCustomPasswordFromDriveWindow({
            submitPassword,
            onFail: () => {
                setIsWaitingForPassword(false);
            },
        });
    }, [isLoading, isPasswordNeeded, isError, submitPassword, isHandlingCustomPassword]);

    return {
        isReady,
        isError,
        error: error[0] as Error,
        customPassword,
        token,
        linkIdParam,
        urlPassword,
        isWaitingForPasswordFromDriveWindow,
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
