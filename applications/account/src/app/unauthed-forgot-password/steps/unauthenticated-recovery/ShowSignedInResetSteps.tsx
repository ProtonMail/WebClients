import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const ShowSignedInResetSteps = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username } = snapshot.context;

    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'unauthenticatedRecoveryActiveSessionInstructions',
        });
    }, []);

    return (
        <>
            <Header
                title={c('Title').t`Try changing your password in your active web session`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p className="m-0">
                    {getBoldFormattedText(
                        c('Info')
                            .t`Resetting your password in your active web session will ensure **your encrypted data will remain accessible** after you change your password.`
                    )}
                </p>
                <div className="mt-6">
                    <p className="m-0 text-semibold text-lg">{c('Info').t`How to perform a signed-in reset`}</p>
                    <ol className="my-2">
                        <li>
                            {getBoldFormattedText(
                                c('Info')
                                    .t`Open your active session in the browser, and go to **Settings → All settings → Recovery → Password reset settings.**`
                            )}
                        </li>
                        <li>
                            {getBoldFormattedText(
                                c('Info').t`Click **Request password reset** and follow the prompts.`
                            )}
                        </li>
                    </ol>
                    <Href
                        href={getKnowledgeBaseUrl('/signed-in-reset')}
                        key="learn-more-link"
                        className="text-underline color-primary"
                    >
                        {c('Link').t`Learn more`}
                    </Href>
                </div>
                <Button
                    size="large"
                    shape="outline"
                    fullWidth
                    className="mt-6"
                    onClick={() => send({ type: 'decision.skip' })}
                >
                    {c('Action').t`Try another way`}
                </Button>
            </Content>
        </>
    );
};
