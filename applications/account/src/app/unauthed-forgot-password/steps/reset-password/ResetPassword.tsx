import { useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';

import SetPasswordWithPolicyForm from '../../../components/password-forms/SetPasswordWithPolicyForm';
import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import {
    selectResetResponse,
    selectResetWithDataLoss,
    selectSubmitting,
    selectUsername,
} from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

/** The new password; the machine resets it with what the flow recovered, and signs in. */
export const ResetPassword = ({ onBack }: ForgotPasswordStepProps) => {
    const actorRef = ForgotPasswordContext.useActorRef();
    const username = ForgotPasswordContext.useSelector(selectUsername);
    const resetResponse = ForgotPasswordContext.useSelector(selectResetResponse);
    const resetWithDataLoss = ForgotPasswordContext.useSelector(selectResetWithDataLoss);
    const submitting = ForgotPasswordContext.useSelector(selectSubmitting);
    const { createNotification } = useNotifications();
    const errorHandler = useErrorHandler();
    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'setNewPassword',
        });
    }, []);

    useEffect(() => {
        // The machine sends the user to sign in with the new password; what failed is still traced
        const subscription = actorRef.on('signIn.failed', ({ error }) => errorHandler(error, { notify: false }));
        return () => subscription.unsubscribe();
    }, [actorRef, errorHandler]);

    const handleSubmit = (password: string) => {
        createNotification({
            text: c('Info').t`This can take a few seconds or a few minutes depending on your device`,
            type: 'info',
        });
        actorRef.send({ type: 'password.submitted', payload: { password } });
    };

    return (
        <>
            <Header
                title={c('Title').t`Reset password?`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={onBack}
            />
            <Content>
                <SetPasswordWithPolicyForm
                    passwordPolicies={resetResponse?.PasswordPolicies ?? []}
                    onSubmit={({ password }) => handleSubmit(password)}
                    submitting={submitting}
                    submitButtonColor={resetWithDataLoss ? 'danger' : 'norm'}
                />
            </Content>
        </>
    );
};
