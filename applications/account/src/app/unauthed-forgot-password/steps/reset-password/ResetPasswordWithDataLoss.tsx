import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import lockErrorExclamation from '../../icons/lock-error-exclamation.svg';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const ResetPasswordWithDataLoss = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username } = snapshot.context;

    const DataRecoveryOptionsLink = (
        <Href
            key="learn-more-link"
            href={getKnowledgeBaseUrl('/recover-encrypted-messages-files')}
            className="inline-block"
        >{c('Link').t`data recovery option`}</Href>
    );

    const DataLockedText = (
        <span key="data-locked-text" className="color-danger text-semibold">{c('Info')
            .t`your encrypted data will be locked`}</span>
    );
    return (
        <>
            <Header title={c('Title').t`Reset password?`} subTitle={<UserNameWithIcon username={username} />} />
            <Content>
                <p className="m-0">
                    {getBoldFormattedText(
                        c('Info')
                            .t`You can now reset your password to regain access to your account. **This will disable 2-factor authentication.**`
                    )}
                </p>
                <div className="rounded-lg border border-weak p-3 mt-6">
                    <div className="flex flex-nowrap gap-2">
                        <img
                            alt=""
                            src={lockErrorExclamation}
                            className="w-custom shrink-0 self-start"
                            style={{ '--w-custom': '28px' }}
                        />
                        <div>
                            <div>
                                {c('Info')
                                    .jt`Due to end-to-end encryption, you can reset your password, but ${DataLockedText} until you use a ${DataRecoveryOptionsLink}:`}
                            </div>
                            <ul className="m-0 mt-4">
                                <li className="text-semibold">{c('Info').t`Recovery phrase`}</li>
                                <li className="text-semibold">{c('Info').t`Recovery contacts`}</li>
                                <li className="text-semibold">{c('Info').t`Recovery file`}</li>
                                <li className="text-semibold">{c('Info').t`Your old password`}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <Button
                    size="large"
                    color="danger"
                    fullWidth
                    className="mt-6"
                    onClick={() => send({ type: 'decision.yes' })}
                >
                    {c('Action').t`Continue`}
                </Button>

                <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                    {c('Action').t`Try another way`}
                </Button>
            </Content>
        </>
    );
};
