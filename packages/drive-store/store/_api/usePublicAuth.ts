import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CODES, HTTP_STATUS_CODE } from '@proton/shared/lib/constants';

import { sendErrorReport } from '../../utils/errorHandling';
import { ERROR_CODE_INVALID_SRP_PARAMS, default as usePublicSession } from './usePublicSession';

/**
 * usePublicAuth automatically starts SRP handshake and if not password is
 * needed, it also continues automatically with initiating session.
 * In case custom password is set, it will be set in `isPasswordNeeded` and
 * then `submitPassword` callback should be used.
 */
export default function usePublicAuth(token: string, urlPassword: string) {
    const { createNotification } = useNotifications();

    const { hasSession, initHandshake, initSession } = usePublicSession();
    const [isLoading, withLoading] = useLoading(true);
    const [error, setError] = useState<[unknown, string]>([, '']);

    const [isPasswordNeeded, setIsPasswordNeeded] = useState(false);
    const [savedCustomedPassword, setSavedCustomPassword] = useState<string>('');
    const [isLegacy, setIsLegacy] = useState<boolean>(false);

    /**
     * handleInitialLoadError processes error from initializing handshake
     * or session. It provides custom message in case of not existing link,
     * otherwise it uses the message from API. Any non-structured error is
     * converted to general message about failure and is reported to Sentry.
     */
    const handleInitialLoadError = (error: unknown) => {
        const apiError = getApiError(error);
        if (apiError.status === HTTP_STATUS_CODE.NOT_FOUND || apiError.code === API_CODES.NOT_FOUND_ERROR) {
            setError([error, c('Title').t`The link either does not exist or has expired`]);
            return;
        }

        // Code 2026 can happen for different reasons.
        // During initHandshake, it can happen when "volume is not available"
        // or "file has reached the download limit".
        // During initSession, it can mean the generated password is wrong or
        // custom password is needed. These cases are handled manually in
        // useEffect below and doesn't have to be taken care of here as here
        // would not be possible to distinguish the situation anyway.
        if (apiError.code === ERROR_CODE_INVALID_SRP_PARAMS) {
            setError([error, c('Title').t`The link expired`]);
            return;
        }

        // Any other message from API, for example "Volume is not available".
        if (apiError.message) {
            setError(apiError.message);
            return;
        }

        setError([error, c('Title').t`Cannot load link`]);
        sendErrorReport(error);
    };

    useEffect(() => {
        if (hasSession) {
            return;
        }

        void withLoading(
            initHandshake(token)
                .then(({ handshakeInfo, isLegacySharedUrl, hasCustomPassword }) => {
                    if (isLegacySharedUrl) {
                        setIsLegacy(true);
                    }
                    if (hasCustomPassword) {
                        setIsPasswordNeeded(true);
                        return;
                    }
                    return initSession(token, urlPassword, handshakeInfo).catch((error) => {
                        const apiError = getApiError(error);
                        if (apiError.code === ERROR_CODE_INVALID_SRP_PARAMS) {
                            setIsPasswordNeeded(true);
                            return;
                        }
                        throw error;
                    });
                })
                .catch((error) => {
                    handleInitialLoadError(error);
                })
        );
    }, [hasSession]);

    const submitPassword = async (customPassword: string) => {
        await initHandshake(token)
            .then(async ({ handshakeInfo, hasGeneratedPasswordIncluded }) => {
                const password = hasGeneratedPasswordIncluded ? urlPassword + customPassword : customPassword;
                return initSession(token, password, handshakeInfo)
                    .then(() => {
                        setIsPasswordNeeded(false);
                        if (customPassword) {
                            setSavedCustomPassword(customPassword);
                        }
                    })
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
        customPassword: savedCustomedPassword,
        error,
        isLegacy,
        isPasswordNeeded,
        submitPassword,
    };
}
