import { useSearchParamsEffect } from '@proton/components';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import useLoading from '@proton/hooks/useLoading';
import { type ValidateResetTokenResponse, validateResetToken } from '@proton/shared/lib/api/reset';

import { useResetPasswordTelemetry } from '../../reset/resetPasswordTelemetry';
import { DeviceRecoveryLevel } from '../actions';
import type { UnauthedForgotPasswordStateMachine } from '../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../wizard/MachineWizardProvider';

interface Props {
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    onSuccess: (username: string) => void;
}

export const useAutomaticRecoveryVerification = ({ onPreSubmit, onStartAuth, onSuccess }: Props) => {
    const [loading, withLoading] = useLoading();
    const { send } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const errorHandler = useErrorHandler();
    const { sendResetPasswordMethodValidated } = useResetPasswordTelemetry({ variant: 'B' });

    const silentApi = useSilentApi();

    useSearchParamsEffect((params) => {
        const username = params.get('username');
        const token = params.get('token');

        /**
         * Automatic token validation reset
         */
        if (username && token) {
            const run = async () => {
                try {
                    await onPreSubmit();
                    await onStartAuth();
                    const resetResponse = await silentApi<ValidateResetTokenResponse>(
                        validateResetToken(username, token)
                    );
                    sendResetPasswordMethodValidated({ step: 'entry', method: 'mnemonic' });
                    send({
                        type: 'token.prefilled',
                        payload: {
                            username,
                            ownershipVerificationCode: token,
                            resetResponse,
                            deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
                        },
                    });
                } catch (e) {
                    errorHandler(e);
                }
            };
            void withLoading(run());

            return new URLSearchParams();
        }

        /**
         * Automatic username filling
         */
        if (username) {
            send({
                type: 'username.prefilled',
                payload: {
                    username,
                },
            });
            onSuccess(username);
            return new URLSearchParams();
        }
    }, []);

    return {
        loading,
    };
};
