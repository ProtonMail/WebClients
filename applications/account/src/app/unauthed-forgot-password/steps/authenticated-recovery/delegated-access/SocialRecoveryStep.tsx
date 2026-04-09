import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { UserNameWithIcon } from '../../../../components/username/UserNameWithIcon';
import Content from '../../../../public/Content';
import Header from '../../../../public/Header';
import lockWarningExclamation from '../../../icons/lock-warning-exclamation.svg';
import type { UnauthedForgotPasswordStateMachine } from '../../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../../wizard/MachineWizardProvider';

export const SocialRecoveryStep = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { delegatedAccessContacts, username } = snapshot.context;

    const socialRecoveryContacts = delegatedAccessContacts.filter(({ Types }) =>
        hasBit(Types, DelegatedAccessTypeEnum.SocialRecovery)
    );

    const RecoveryContactsLink = (
        <Href
            key="recovery-contacts-link"
            href={getKnowledgeBaseUrl('/contact-assisted-recovery')}
            className="inline-block"
        >{c('Link').t`contacts’ assistance`}</Href>
    );

    const DataLockedText = (
        <span key="data-locked-text" className="text-semibold">{c('Info').t`Your encrypted data will be locked`}</span>
    );

    return (
        <>
            <Header
                title={c('Title').t`Reset password?`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <div className="mb-4">
                    {c('Info').t`You can now reset your password to regain access to your account.`}{' '}
                    <b>{c('Info')
                        .t`This will sign you out of any active sessions and disable 2-factor authentication.`}</b>
                </div>

                <InputFieldStackedGroup>
                    <InputFieldStacked
                        icon={
                            <img
                                alt=""
                                src={lockWarningExclamation}
                                className="w-custom"
                                style={{ '--w-custom': '28px' }}
                            />
                        }
                        isGroupElement
                        classname="bg-norm-weak"
                        style={{
                            '--stacked-field-background': 'var(--background-weak)',
                        }}
                    >
                        {/* translator: Full sentence "Your encrypted data will be locked, but recoverable with your contacts’ assistance:" */}
                        <div>{c('Info').jt`${DataLockedText}, but recoverable with your ${RecoveryContactsLink}:`}</div>
                    </InputFieldStacked>
                    {socialRecoveryContacts.map(({ TargetEmail, DelegatedAccessID }) => (
                        <InputFieldStacked
                            icon={<Avatar color="weak">{getInitials(TargetEmail)}</Avatar>}
                            isGroupElement
                            key={DelegatedAccessID}
                        >
                            <div className="text-semibold text-ellipsis" title={TargetEmail}>
                                {TargetEmail}
                            </div>
                        </InputFieldStacked>
                    ))}
                </InputFieldStackedGroup>

                <Button
                    size="large"
                    color="norm"
                    fullWidth
                    onClick={() => send({ type: 'socialRecovery.started' })}
                    className="mt-6"
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
