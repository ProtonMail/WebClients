import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { selectUsername } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

export const ConfirmMnemonicPhraseRecovery = ({ onBack }: ForgotPasswordStepProps) => {
    const { send } = ForgotPasswordContext.useActorRef();
    const username = ForgotPasswordContext.useSelector(selectUsername);

    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'mnemonicRecoveryConfirmPhrase',
        });
    }, []);

    return (
        <>
            <Header
                title={c('Title').t`Reset password?`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={onBack}
            />
            <Content>
                <div className="mb-4">
                    {c('Info').t`You can now reset your password to regain access to your account.`}{' '}
                    <b>{c('Info')
                        .t`This will sign you out of any active sessions and disable 2-factor authentication.`}</b>
                </div>

                <div className="rounded-lg border border-weak p-3">
                    <div className="flex flex-nowrap gap-2">
                        <IcCheckmarkCircleFilled className="color-success shrink-0 m-0.5" />
                        <div>
                            <div className="text-semibold mb-2">
                                {c('Info').t`Data recoverable with recovery phrase`}
                            </div>
                            <div>{c('Info').t`You will regain complete or partial access to your encrypted data.`}</div>
                        </div>
                    </div>
                </div>

                <Button
                    size="large"
                    color="norm"
                    onClick={() => send({ type: 'decision.confirm' })}
                    fullWidth
                    className="mt-6"
                >
                    {c('Action').t`Continue`}
                </Button>
            </Content>
        </>
    );
};
