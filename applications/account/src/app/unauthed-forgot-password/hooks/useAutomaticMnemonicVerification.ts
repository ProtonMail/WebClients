import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLocalState from '@proton/components/hooks/useLocalState';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import useLoading from '@proton/hooks/useLoading';
import { decodeAutomaticResetParams } from '@proton/shared/lib/helpers/encoding';

import { defaultPersistentKey } from '../../public/helper';
import { useResetPasswordTelemetry } from '../../reset/resetPasswordTelemetry';
import { authMnemonicAndGetKeys } from '../actions';
import type { UnauthedForgotPasswordStateMachine } from '../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../wizard/MachineWizardProvider';

interface Props {
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
}

export const useAutomaticMnemonicVerification = ({ onPreSubmit, onStartAuth }: Props) => {
    const [loading, withLoading] = useLoading();
    const { sendResetPasswordMethodValidated } = useResetPasswordTelemetry({
        variant: 'B',
    });

    const { send } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const silentApi = useSilentApi();

    const [persistent] = useLocalState(false, defaultPersistentKey);
    const history = useHistory();
    const location = useLocation();
    const errorHandler = useErrorHandler();

    /**
     * Recovery phrase automatic password reset
     */
    useEffect(() => {
        const hash = location.hash.slice(1);
        if (!hash) {
            return;
        }
        history.replace({ ...location, hash: '' });

        let params;
        try {
            params = decodeAutomaticResetParams(hash);
        } catch (error) {
            errorHandler(error);
        }

        if (!params) {
            return;
        }

        const { username, value } = params;
        if (!username || !value) {
            return;
        }

        const run = async () => {
            try {
                await onPreSubmit?.();
                await onStartAuth();
                const mnemonicData = await authMnemonicAndGetKeys({
                    username,
                    mnemonic: value,
                    persistent,
                    api: silentApi,
                });
                sendResetPasswordMethodValidated({ step: 'entry', method: 'mnemonic' });
                if (mnemonicData) {
                    send({
                        type: 'mnemonic.prefilled',
                        payload: {
                            username,
                            mnemonicData,
                        },
                    });
                }
            } catch (e) {
                errorHandler(e);
            }
        };

        void withLoading(run());
    }, []);

    return { loading };
};
