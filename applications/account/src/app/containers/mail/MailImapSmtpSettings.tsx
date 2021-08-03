import { c } from 'ttag';

import { ProtonMailBridgeSection, SettingsPropsShared } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getBridgePage = () => {
    return {
        text: c('Title').t`IMAP/SMTP`,
        to: '/mail/imap-smtp',
        icon: 'imap-smtp',
        subsections: [
            {
                text: c('Title').t`ProtonMail Bridge`,
                id: 'protonmail-bridge',
            },
        ],
    };
};

const MailImapSmtpSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getBridgePage()}>
            <ProtonMailBridgeSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailImapSmtpSettings;
