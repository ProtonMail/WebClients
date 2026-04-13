import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { SignedInSessionsList } from '../../components/SignedInSessionsList';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const AccountLost = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { resetResponse, username } = snapshot.context;

    const hasOtherSessions = resetResponse?.Sessions && resetResponse?.Sessions.length > 0;
    const AlternateStepInstruction = hasOtherSessions
        ? c('Info')
              .t`Try recovering your account from a **device or browser where you have signed in before**, as it may be possible from there:`
        : c('Info').t`If possible, when signing in, use a device or a browser where you’ve signed in before.`;

    return (
        <>
            <Header
                title={c('Title').t`Couldn’t recover your account`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content className="flex flex-column gap-4">
                <p className="m-0">{c('Info')
                    .t`Unfortunately there is no recovery method available for this account.`}</p>
                <p className="m-0">{getBoldFormattedText(AlternateStepInstruction)}</p>
                {hasOtherSessions && (
                    <div>
                        <SignedInSessionsList activeSessions={resetResponse?.Sessions} />
                    </div>
                )}
            </Content>
            <div className="flex flex-column flex-wrap gap-2 justify-between mt-6">
                <ButtonLike
                    as={Href}
                    size="large"
                    fullWidth
                    href={getKnowledgeBaseUrl('/set-account-recovery-methods')}
                >
                    <span className="flex items-center gap-2 justify-center">
                        {c('Action').t`Learn about recovery options`} <IcArrowWithinSquare />
                    </span>
                </ButtonLike>
            </div>
        </>
    );
};
