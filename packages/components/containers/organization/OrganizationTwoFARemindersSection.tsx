import { c } from 'ttag';

import { useMemberAddresses } from '@proton/account';
import { Button } from '@proton/atoms';
import { Info, useConfig, useMembers, useModalState } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';

import { Label, Loader, Row } from '../../components';
import { SettingsParagraph } from '../account';
import SendEmailReminderTwoFAModal from './SendEmailReminderTwoFAModal';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFARemindersSection = ({ organization }: Props) => {
    const { APP_NAME } = useConfig();
    const [modalProps, setModal, renderModal] = useModalState();
    const [members] = useMembers();
    const noTwoFAMembers =
        members?.filter((member) => (member.State === undefined || member.State === 1) && member['2faStatus'] === 0) ||
        [];

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
            <Row className="mt-1">
                <Label>
                    <span className="mr-0.5">{c('Label').t`Email`}</span>
                    <span className="hidden md:inline">
                        <Info
                            title={c('Tooltip')
                                .t`Members who do not use 2FA will get an email asking them to enable it as soon as possible.`}
                        />
                    </span>
                </Label>
                <div className="flex items-center">
                    <Button
                        id="send-email-reminder-button"
                        onClick={() => setModal(true)}
                        disabled={noTwoFAMembers.length === 0}
                    >{c('Action').t`Send email reminder`}</Button>
                </div>
            </Row>
        </>
    );
};

export default OrganizationTwoFARemindersSection;
