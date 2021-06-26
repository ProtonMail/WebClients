import React from 'react';
import { c } from 'ttag';

import { SettingsPropsShared, ContactsSettingsContactsSection, ThemesSection } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getContactsGeneralPage = () => {
    return {
        to: '/contacts/general',
        icon: 'contacts-groups',
        text: c('Title').t`General`,
        subsections: [
            {
                text: c('Title').t`Theme`,
                id: 'theme',
            },
            {
                text: c('Title').t`Contacts`,
                id: 'contacts',
            },
        ],
    };
};

const ContactsGeneralSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions config={getContactsGeneralPage()} location={location}>
            <ThemesSection />
            <ContactsSettingsContactsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default ContactsGeneralSettings;
