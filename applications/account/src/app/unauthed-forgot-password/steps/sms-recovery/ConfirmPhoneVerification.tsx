import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import { getResendSMSVerificationCodeText } from '../../../content/helper';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import {
    selectBackWaits,
    selectRedactedRecoveryPhoneNumber,
    selectSubmitting,
    selectUsername,
} from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

/** The code is only sent to the recovery phone once the user asks, since it may cost them. */
export const ConfirmPhoneVerification = ({ onBack }: ForgotPasswordStepProps) => {
    const { send } = ForgotPasswordContext.useActorRef();
    const username = ForgotPasswordContext.useSelector(selectUsername);
    const redactedRecoveryPhoneNumber = ForgotPasswordContext.useSelector(selectRedactedRecoveryPhoneNumber);
    const sendingCode = ForgotPasswordContext.useSelector(selectSubmitting);
    // While the code is sent, "Try another way" waits for it, as the machine does
    const skipWaits = ForgotPasswordContext.useSelector(selectBackWaits);
    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });

    const RedactedPhoneNumber = <strong key="redacted-phone-number">{redactedRecoveryPhoneNumber}</strong>;

    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'enterRecoverySms',
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

                <p>{getResendSMSVerificationCodeText(RedactedPhoneNumber)}</p>

                <Button
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    onClick={() => send({ type: 'code.requested' })}
                    loading={sendingCode}
                    className="mt-6"
                >
                    {c('Action').t`Send code`}
                </Button>

                <Button
                    size="large"
                    fullWidth
                    className="mt-2"
                    disabled={skipWaits}
                    noDisabledStyles={skipWaits}
                    onClick={() => send({ type: 'decision.skip' })}
                >
                    {c('Action').t`Try another way`}
                </Button>
            </Content>
        </>
    );
};
