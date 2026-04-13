import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import { getResendSMSVerificationCodeText } from '../../../content/helper';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { useRequestCode } from '../../hooks/useRequestCode';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const EnterSMSRecoveryCode = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username, redactedRecoveryPhoneNumber } = snapshot.context;
    const { sendResetPasswordCodeSent, sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });

    const [loading, withLoading] = useLoading();
    const errorHandler = useErrorHandler();
    const RedactedPhoneNumber = <strong key="redacted-phone-number">{redactedRecoveryPhoneNumber}</strong>;

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'enterRecoverySms',
        });
    }, []);

    const requestCode = useRequestCode({
        method: 'phone',
        username,
        onSuccess: () => {
            send({
                type: 'sms.code.sent',
            });
        },
        onError: errorHandler,
    });

    const handleSubmit = () => {
        if (loading) {
            return;
        }

        void withLoading(
            requestCode().then(() => sendResetPasswordCodeSent({ step: 'enterRecoverySms', method: 'sms' }))
        );
    };
    return (
        <>
            <Header
                title={c('Title').t`Verify it’s you`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p>
                    {c('Info')
                        .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
                </p>

                <p>{getResendSMSVerificationCodeText(RedactedPhoneNumber)}</p>

                <Button
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    onClick={handleSubmit}
                    loading={loading}
                    className="mt-6"
                >
                    {c('Action').t`Send code`}
                </Button>

                <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                    {c('Action').t`Try another way`}
                </Button>
            </Content>
        </>
    );
};
