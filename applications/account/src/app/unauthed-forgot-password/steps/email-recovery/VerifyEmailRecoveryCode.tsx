import { useEffect } from 'react';

import { c } from 'ttag';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import { getEmailVerificationCodeText } from '../../../content/helper';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { ResetCodeForm } from '../../components/ResetCodeForm';
import {
    selectEmailAwaitingCode,
    selectRedactedRecoveryEmail,
    selectUsername,
} from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

/** The machine sends the code to the recovery email as soon as this step opens. */
export const VerifyEmailRecoveryCode = ({ onBack }: ForgotPasswordStepProps) => {
    const username = ForgotPasswordContext.useSelector(selectUsername);
    const redactedRecoveryEmail = ForgotPasswordContext.useSelector(selectRedactedRecoveryEmail);
    const awaitingCode = ForgotPasswordContext.useSelector(selectEmailAwaitingCode);
    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });

    const RedactedEmail = <strong key="redacted-recovery-email">{redactedRecoveryEmail}</strong>;

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'verifyRecoveryEmail',
        });
    }, []);

    return (
        <>
            <Header
                title={c('Title').t`Verify it’s you`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={onBack}
            />
            <Content>
                <p>
                    {c('Info')
                        .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
                </p>

                <p>{getEmailVerificationCodeText(RedactedEmail)}</p>
                <ResetCodeForm method="email" destination={redactedRecoveryEmail ?? ''} awaitingCode={awaitingCode} />
            </Content>
        </>
    );
};
