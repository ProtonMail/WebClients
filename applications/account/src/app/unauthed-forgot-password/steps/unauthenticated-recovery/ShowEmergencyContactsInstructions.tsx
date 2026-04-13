import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { ACCOUNT_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const ShowEmergencyContactsInstructions = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username } = snapshot.context;

    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'unauthenticatedRecoveryEmergencyContactInstructions',
        });
    }, []);

    return (
        <>
            <Header
                title={c('Title').t`Ask your emergency contacts for help`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <div className="mt-6">
                    <p className="m-0 text-semibold text-lg">{c('Info')
                        .t`How your emergency contact can change your password for you:`}</p>
                    <ol className="my-2">
                        <li>
                            {getBoldFormattedText(
                                c('Info')
                                    .t`Ask them to sign in to their ${ACCOUNT_APP_NAME} in the browser, and go to **Settings → All settings → Recovery → Emergency access→ People who trust me.**`
                            )}
                        </li>
                        <li>
                            {getBoldFormattedText(
                                c('Info')
                                    .t`From there, they can request emergency access to your account by clicking **Request access.**`
                            )}
                        </li>
                        <li>
                            {getBoldFormattedText(
                                c('Info')
                                    .t`Depending on your settings, they may receive access immediately, or after a designated **waiting period.**`
                            )}
                        </li>
                        <li>
                            {getBoldFormattedText(
                                c('Info')
                                    .t`Once access to your account has been granted, they can access your **Recovery** settings and **change your ${ACCOUNT_APP_NAME} password** for you.`
                            )}
                        </li>
                    </ol>
                    <Href
                        href={getKnowledgeBaseUrl('/emergency-access-settings')}
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
