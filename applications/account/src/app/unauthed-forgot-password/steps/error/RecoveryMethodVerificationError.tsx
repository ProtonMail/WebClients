import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import Content from '../../../public/Content';
import Header from '../../../public/Header';
import userExclamation from '../../../public/user-exclamation.svg';
import { selectApiErrorMessage } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

export const RecoveryMethodVerificationError = ({ onBack }: ForgotPasswordStepProps) => {
    const { send } = ForgotPasswordContext.useActorRef();
    const apiErrorMessage = ForgotPasswordContext.useSelector(selectApiErrorMessage);

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
                onBack={onBack}
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
