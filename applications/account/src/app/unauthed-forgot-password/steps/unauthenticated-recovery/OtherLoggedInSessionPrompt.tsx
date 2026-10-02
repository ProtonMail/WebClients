import { useEffect } from 'react';

import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { selectUsername } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';
import YesNoButtons from '../authenticated-recovery/delegated-access/components/YesNoButtons';

export const OtherLoggedInSessionPrompt = ({ onBack }: ForgotPasswordStepProps) => {
    const { send } = ForgotPasswordContext.useActorRef();
    const username = ForgotPasswordContext.useSelector(selectUsername);

    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'unauthenticatedRecoveryOtherSessionsPrompt',
        });
    }, []);

    return (
        <>
            <Header
                title={c('Title').t`Are you already signed in to ${BRAND_NAME} in a browser?`}
                onBack={onBack}
                subTitle={<UserNameWithIcon username={username} />}
            />
            <Content>
                <p>
                    {getBoldFormattedText(
                        c('Info')
                            .t`If you are signed in to a ${BRAND_NAME} web app in **another browser**, you may be able to perform a password reset from your active session.`
                    )}
                </p>
                <p className="text-semibold">{c('Info')
                    .t`Can you access your active web session in another browser?`}</p>
                <YesNoButtons onYes={() => send({ type: 'decision.yes' })} onNo={() => send({ type: 'decision.no' })} />
            </Content>
        </>
    );
};
