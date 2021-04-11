import React from 'react';
import { c } from 'ttag';

import {
    SettingsPropsShared,
    ContactsSettingsContactsSection,
    ContactsSettingsGroupsSection,
    ThemesSection,
} from 'react-components';

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
            {
                text: c('Title').t`Contact groups`,
                id: 'contact-groups',
            },
        ],
    };
};

const ContactsGeneralSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions config={getContactsGeneralPage()} location={location}>
            <ThemesSection />
            <ContactsSettingsContactsSection />
            <ContactsSettingsGroupsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default ContactsGeneralSettings;
