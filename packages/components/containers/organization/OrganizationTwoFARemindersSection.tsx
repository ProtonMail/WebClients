import { c, msgid } from 'ttag';

import { useMemberAddresses } from '@proton/account';
import { useMembers } from '@proton/account/members/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import OrganizationTwoFAHeader from '@proton/components/containers/organization/OrganizationTwoFAHeader';
import useConfig from '@proton/components/hooks/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';

import SendEmailReminderTwoFAModal from './SendEmailReminderTwoFAModal';
import { getTwoFAMemberStatistics } from './organizationTwoFAHelper';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFARemindersSection = ({ organization }: Props) => {
    const { APP_NAME } = useConfig();
    const [modalProps, setModal, renderModal] = useModalState();
    const [members] = useMembers();

    const { canHaveTwoFAMembersLength, noTwoFAMembers, noTwoFAMembersLength } = getTwoFAMemberStatistics(members);

    const { value: memberAddressesMap } = useMemberAddresses({ members, partial: true });

    if (!organization || !members) {
        return <Loader />;
    }

    return (
        <>
            {renderModal && (
                <SendEmailReminderTwoFAModal
                    {...modalProps}
                    members={noTwoFAMembers}
                    memberAddressesMap={memberAddressesMap}
                />
            )}
            <SettingsParagraph
                learnMoreUrl={
                    APP_NAME === APPS.PROTONVPN_SETTINGS
                        ? 'https://protonvpn.com/support/require-2fa-organization'
                        : getKnowledgeBaseUrl('/two-factor-authentication-organization')
                }
            >
                {c('Info').t`Send emails to encourage your members to protect their accounts with 2FA.`}
            </SettingsParagraph>
            <div className="mb-4">
                <OrganizationTwoFAHeader organization={organization} />
            </div>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold flex items-center">
                        <span className="mr-0.5">{c('Label').t`Members without 2FA`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Excluding single sign-on users whose 2FA is handled by your identity provider`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    {c('Info').ngettext(
                        msgid`${noTwoFAMembersLength}/${canHaveTwoFAMembersLength} member`,
                        `${noTwoFAMembersLength}/${canHaveTwoFAMembersLength} members`,
                        canHaveTwoFAMembersLength
                    )}
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold flex items-center">
                        <span className="mr-0.5">{c('Label').t`Ask members to set up 2FA`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Members who do not use 2FA will get an email asking them to enable it as soon as possible. Single sign-on users will not receive the email reminder.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <Button
                        id="send-email-reminder-button"
                        onClick={() => setModal(true)}
                        disabled={noTwoFAMembers.length === 0}
                    >{c('Action').t`Send email reminder`}</Button>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default OrganizationTwoFARemindersSection;
