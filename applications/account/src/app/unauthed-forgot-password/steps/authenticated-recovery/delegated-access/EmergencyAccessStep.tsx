import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { UserNameWithIcon } from '../../../../components/username/UserNameWithIcon';
import Content from '../../../../public/Content';
import Header from '../../../../public/Header';
import type { UnauthedForgotPasswordStateMachine } from '../../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../../wizard/MachineWizardProvider';
import YesNoButtons from './components/YesNoButtons';

export const EmergencyAccessStep = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { delegatedAccessContacts, resetResponse, username } = snapshot.context;

    const emergencyContacts = delegatedAccessContacts.filter(({ Types }) =>
        hasBit(Types, DelegatedAccessTypeEnum.EmergencyAccess)
    );

    return (
        <>
            <Header
                title={c('Title').t`Can you reach out to your emergency contacts?`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p className="mt-0">
                    {resetResponse
                        ? getBoldFormattedText(
                              c('Info')
                                  .t`Get in touch with your emergency contacts, to see if they can help. After requesting emergency access to your account, they will be able to change your password for you **after the wait time for access has passed**.`
                          )
                        : getBoldFormattedText(
                              c('Info')
                                  .t`If you have emergency contacts, get in touch with them, to see if they can help. After requesting emergency access to your account, they will be able to change your password for you **after the wait time for access has passed.**`
                          )}
                </p>
                <div className="flex">
                    <div className="max-h-custom" style={{ '--max-h-custom': '12.5rem' }}>
                        <Scroll>
                            <InputFieldStackedGroup>
                                {emergencyContacts.map(({ TargetEmail, DelegatedAccessID }) => (
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
                        </Scroll>
                    </div>
                </div>
                <p className="text-semibold">{c('Info').t`Can you reach out to your contact?`}</p>
                <YesNoButtons onYes={() => send({ type: 'decision.yes' })} onNo={() => send({ type: 'decision.no' })} />
            </Content>
        </>
    );
};
