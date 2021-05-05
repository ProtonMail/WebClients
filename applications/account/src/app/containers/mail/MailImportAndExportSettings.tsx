import React from 'react';
import { c } from 'ttag';

import { StartImportSection, ImportListSection, ImportExportSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getImportPage = () => {
    return {
        text: c('Title').t`Import & export`,
        to: '/mail/import-export',
        icon: 'import',
        subsections: [
            {
                text: c('Title').t`Import Assistant`,
                id: 'start-import',
            },
            {
                text: c('Title').t`Current & past imports`,
                id: 'import-list',
            },
            {
                text: c('Title').t`Import-Export app`,
                id: 'import-export',
            },
        ],
    };
};

const MailImportAndExportSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            config={getImportPage()}
            setActiveSection={setActiveSection}
            location={location}
        >
            <StartImportSection />
            <ImportListSection />
            <ImportExportSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailImportAndExportSettings;
