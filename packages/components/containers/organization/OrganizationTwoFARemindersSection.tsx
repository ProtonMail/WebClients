import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Alert, Info, useConfig, useMembers, useModals } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Organization } from '@proton/shared/lib/interfaces';

import { Label, Loader, Row } from '../../components';
import { SettingsParagraph } from '../account';
import SendEmailReminderTwoFAModal from './SendEmailReminderTwoFAModal';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFARemindersSection = ({ organization }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [members, loadingMembers] = useMembers();

    if (!organization || loadingMembers) {
        return <Loader />;
    }

    // Organization is not setup.
    if (!organization?.HasKeys) {
        return <Alert className="mb-1" type="warning">{c('Info').t`Multi-user support not enabled.`}</Alert>;
    }

    const noTwoFAMembers =
        members.filter((member) => (member.State === undefined || member.State === 1) && member['2faStatus'] === 0) ||
        [];

    return (
        <>
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
                <div className="flex flex-align-items-center">
                    <Button
                        id="send-email-reminder-button"
                        onClick={() => createModal(<SendEmailReminderTwoFAModal members={noTwoFAMembers} />)}
                        disabled={noTwoFAMembers.length === 0}
                    >{c('Action').t`Send email reminder`}</Button>
                </div>
            </Row>
        </>
    );
};

export default OrganizationTwoFARemindersSection;
