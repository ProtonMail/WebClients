import { useEffect } from 'react';

import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { SignedInSessionsList } from '../../components/SignedInSessionsList';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';
import YesNoButtons from './delegated-access/components/YesNoButtons';

export const AuthenticatedSessionPrompt = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { resetResponse, username } = snapshot.context;

    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'authenticatedRecoveryOtherSessionsPrompt',
        });
    }, []);

    const activeSessions = resetResponse?.Sessions;
    // This should not happen as the state machine has a `null` check. This is purely to make TS happy
    if (!activeSessions) {
        return null;
    }
    return (
        <>
            <Header
                title={c('Title').t`Can you access your session in the browser?`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p>
                    {getBoldFormattedText(
                        c('Info')
                            .t`We detected you are already signed in to a ${BRAND_NAME} web app on **another browser**. You may be able to perform a password reset from your active session.`
                    )}
                </p>

                <p className="mt-6 mb-1">{c('Info').t`Web sessions detected:`}</p>
                <SignedInSessionsList activeSessions={activeSessions} />
                <p className="text-semibold my-6">{c('Info').t`Can you access your active session?`}</p>
                <YesNoButtons onYes={() => send({ type: 'decision.yes' })} onNo={() => send({ type: 'decision.no' })} />
            </Content>
        </>
    );
};
