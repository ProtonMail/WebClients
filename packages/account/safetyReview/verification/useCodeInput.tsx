import { type ReactNode, useCallback, useState } from 'react';

import { c } from 'ttag';

import { useGetUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { CacheType } from '@proton/redux-utilities/interface';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import type { VerificationMethod } from './verification';
import { getInitiationCall, initiateVerification, sendNewCode, verifyCode } from './verification';

export const useCodeInput = (options?: { showResendCode?: boolean }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const getUserSettings = useGetUserSettings();

    const [state, setState] = useState({ token: '', codeError: false, showResendCode: options?.showResendCode });

    const handleInitiateVerification = useCallback(async (method: VerificationMethod) => {
        const { token } = await initiateVerification({ api, method, config: getInitiationCall(method) });
        setState((prev) => ({ ...prev, token }));
    }, []);

    const handleSubmit = useCallback(
        async (code: string, method: VerificationMethod) => {
            if (!state.token) {
                setState({ token: '', codeError: true, showResendCode: true });
                throw new Error('Resend error');
            }

            try {
                await verifyCode({
                    token: state.token,
                    code,
                    api,
                    method,
                    config: getInitiationCall(method),
                });
                await getUserSettings({ cache: CacheType.None });
            } catch (error: any) {
                const { code } = getApiError(error);

                if (code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                    setState({ token: state.token, codeError: true, showResendCode: true });
                }

                throw error;
            }
        },
        [state.token]
    );

    const handleSendNewCode = useCallback(async (value: ReactNode, token: string, method: VerificationMethod) => {
        await sendNewCode({ token, api, method });

        setState((prev) => ({ ...prev, codeError: false }));

        const boldValue = <b key="bold-value">{value}</b>;
        createNotification({ text: <span>{c('Safety review').jt`Code sent to ${boldValue}`}</span> });
    }, []);

    return {
        actions: {
            handleInitiateVerification,
            handleSubmit,
            handleSendNewCode,
            resetCodeError: useCallback(() => setState((prev) => ({ ...prev, codeError: false })), []),
            showResendCode: useCallback(() => setState((prev) => ({ ...prev, showResendCode: true })), []),
        },
        state: {
            token: state.token,
            showResendCode: state.showResendCode,
            codeError: state.codeError ? c('Safety review').t`Invalid code` : '',
        },
    };
};
