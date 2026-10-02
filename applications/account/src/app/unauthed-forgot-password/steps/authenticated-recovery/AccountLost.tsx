import { useEffect } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useResetPasswordTelemetry } from '../../../reset/resetPasswordTelemetry';
import { SignedInSessionsList } from '../../components/SignedInSessionsList';
import { selectResetResponse, selectUsername } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { ForgotPasswordContext } from '../../wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from '../../wizard/forgotPasswordStep';

export const AccountLost = ({ onBack }: ForgotPasswordStepProps) => {
    const resetResponse = ForgotPasswordContext.useSelector(selectResetResponse);
    const username = ForgotPasswordContext.useSelector(selectUsername);

    const { sendResetPasswordStepLoad } = useResetPasswordTelemetry({ variant: 'B' });
    useEffect(() => {
        sendResetPasswordStepLoad({
            step: 'recoveryFailed',
        });
    }, []);

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
                onBack={onBack}
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
