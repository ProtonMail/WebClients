import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';
import YesNoButtons from '../authenticated-recovery/delegated-access/components/YesNoButtons';

export const OtherLoggedInSessionPrompt = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username } = snapshot.context;

    return (
        <>
            <Header
                title={c('Title').t`Are you already signed in to ${BRAND_NAME} in a browser?`}
                onBack={() => send({ type: 'decision.back' })}
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
