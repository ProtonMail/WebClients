import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const ConfirmMnemonicPhraseRecovery = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username } = snapshot.context;

    return (
        <>
            <Header
                title={c('Title').t`Reset password?`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
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
