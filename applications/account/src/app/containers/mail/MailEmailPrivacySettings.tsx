import { c } from 'ttag';
import { EmailPrivacySection, SettingsPropsShared } from '@proton/components';
import React from 'react';
import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getAddressesPage = () => {
    return {
        text: c('Title').t`Email privacy`,
        to: '/mail/email-privacy',
        icon: 'addresses',
        subsections: [],
    };
};

const MailEmailPrivacySettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getAddressesPage()}>
            <EmailPrivacySection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailEmailPrivacySettings;
