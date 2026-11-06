import { useEffect } from 'react';

import { c } from 'ttag';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import { getSMSVerificationCodeText } from '../../../helper';
import Content from '../../../layout/Content';
import Header from '../../../layout/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { ResetCodeForm } from '../../components/ResetCodeForm';
import {
    selectRedactedRecoveryPhoneNumber,
    selectUsername,
} from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

export const VerifySMSRecoveryCode = ({ onBack }: ForgotPasswordStepProps) => {
    const username = ForgotPasswordContext.useSelector(selectUsername);
    const redactedRecoveryPhoneNumber = ForgotPasswordContext.useSelector(selectRedactedRecoveryPhoneNumber);
    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry();

    const RedactedPhoneNumber = <strong key="redacted-phone-number">{redactedRecoveryPhoneNumber}</strong>;

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'verifyRecoverySms',
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
                <p>{getSMSVerificationCodeText(RedactedPhoneNumber)}</p>
                <ResetCodeForm method="sms" destination={redactedRecoveryPhoneNumber ?? ''} />
            </Content>
        </>
    );
};
