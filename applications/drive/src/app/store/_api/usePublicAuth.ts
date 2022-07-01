import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { useLoading, useNotifications } from '@proton/components';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import { default as usePublicSession, ERROR_CODE_INVALID_SRP_PARAMS } from './usePublicSession';

/**
 * usePublicAuth automatically starts SRP handshake and if not password is
 * needed, it also continues automatically with initiating session.
 * In case custom password is set, it will be set in `isPasswordNeeded` and
 * then `submitPassword` callback should be used.
 */
export default function usePublicAuth(token: string, urlPassword: string) {
    const { createNotification } = useNotifications();

    const { initHandshake, initSession } = usePublicSession();
    const [isLoading, withLoading] = useLoading(true);
    const [error, setError] = useState<string | undefined>();

    const [isPasswordNeeded, setIsPasswordNeeded] = useState(false);

    /**
     * handleInitialLoadError processes error from initializing handshake
     * or session. It provides custom message in case of not existing link,
     * otherwise it uses the message from API. Any non-structured error is
     * converted to general message about failure and is reported to Sentry.
     */
    const handleInitialLoadError = (error: any) => {
        const apiError = getApiError(error);

        if (apiError.status === HTTP_STATUS_CODE.NOT_FOUND || apiError.code === RESPONSE_CODE.NOT_FOUND) {
            setError(c('Title').t`The link either does not exist or has expired`);
            return;
        }

        // for the cases when user removes generated password from shared url
        if (apiError.code === ERROR_CODE_INVALID_SRP_PARAMS) {
            setIsPasswordNeeded(true);
            return;
        }

        // Any other message from API, for example "Volume is not available".
        if (apiError.message) {
            setError(apiError.message);
            return;
        }

        setError(c('Title').t`The link failed to be loaded`);
        reportError(error);
    };

    useEffect(() => {
        void withLoading(
            initHandshake(token)
                .then(({ handshakeInfo, hasCustomPassword }) => {
                    if (hasCustomPassword) {
                        setIsPasswordNeeded(true);
                        return;
                    }
                    return initSession(token, urlPassword, handshakeInfo);
                })
                .catch((error) => {
                    handleInitialLoadError(error);
                })
        );
    }, []);

    const submitPassword = async (customPassword: string) => {
        await initHandshake(token)
            .then(async ({ handshakeInfo, hasGeneratedPasswordIncluded }) => {
                const password = hasGeneratedPasswordIncluded ? urlPassword + customPassword : customPassword;
                return initSession(token, password, handshakeInfo)
                    .then(() => setIsPasswordNeeded(false))
                    .catch((error) => {
                        const apiError = getApiError(error);
                        if (apiError.code === ERROR_CODE_INVALID_SRP_PARAMS) {
                            createNotification({
                                type: 'error',
                                text: c('Error').t`Incorrect password. Please try again.`,
                            });
                            return;
                        }
                        throw error;
                    });
            })
            .catch((error) => {
                handleInitialLoadError(error);
            });
    };

    return {
        isLoading,
        error,
        isPasswordNeeded,
        submitPassword,
    };
}
