import React from 'react';
import { c } from 'ttag';

import { SettingsPropsShared, ContactsSettingsExportSection, ContactsSettingsImportSection } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getImportExportPage = () => {
    return {
        to: '/contacts/import-export',
        icon: 'import',
        text: c('Title').t`Import & export`,
        subsections: [
            {
                text: c('Title').t`Import`,
                id: 'import',
            },
            {
                text: c('Title').t`Export`,
                id: 'export',
            },
        ],
    };
};

const ContactsImportSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions config={getImportExportPage()} location={location}>
            <ContactsSettingsImportSection />
            <ContactsSettingsExportSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default ContactsImportSettings;
