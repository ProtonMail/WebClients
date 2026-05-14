import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import Content from '../../../public/Content';
import Header from '../../../public/Header';
import userExclamation from '../../../public/user-exclamation.svg';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const RecoveryMethodVerificationError = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { apiErrorMessage } = snapshot.context;

    return (
        <>
            <Header
                className="text-center"
                title={
                    <>
                        <div className="mb-6">
                            <img src={userExclamation} alt="" />
                        </div>
                        {c('Title').t`Something went wrong`}
                    </>
                }
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content className="text-center">
                {/* We don't have to translate the error here as it is returned by the API and will already be translated */}
                <p>{apiErrorMessage}</p>
                <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                    {c('Action').t`Back to sign-in`}
                </Button>
            </Content>
        </>
    );
};
