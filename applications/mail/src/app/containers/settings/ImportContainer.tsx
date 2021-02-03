import React from 'react';
import { c } from 'ttag';

import {
    StartImportSection,
    CurrentImportsSection,
    PastImportSection,
    ImportExportSection,
    SettingsPropsShared,
    RelatedSettingsSection,
    AppLink,
} from 'react-components';
import { APPS, PERMISSIONS } from 'proton-shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

const { PAID_MAIL } = PERMISSIONS;

export const getImportPage = () => {
    return {
        text: c('Title').t`Import & export`,
        to: '/settings/import',
        icon: 'import',
        subsections: [
            {
                text: c('Title').t`Import Assistant`,
                id: 'start-import',
            },
            {
                text: c('Title').t`Current imports`,
                id: 'current-import',
            },
            {
                text: c('Title').t`Past imports`,
                id: 'past-import',
            },
            {
                text: c('Title').t`Import-Export app`,
                id: 'import-export',
                permissions: [PAID_MAIL],
            },
            {
                text: c('Title').t`Related features`,
                id: 'related-features',
                hide: true,
            },
        ],
    };
};

const ImportContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            config={getImportPage()}
            setActiveSection={setActiveSection}
            location={location}
        >
            <StartImportSection />
            <CurrentImportsSection />
            <PastImportSection />
            <ImportExportSection />
            <RelatedSettingsSection
                list={[
                    {
                        icon: 'contacts',
                        text: c('Info').t`Import your address book or individual contacts into ProtonContacts.`,
                        link: (
                            <AppLink to="/" toApp={APPS.PROTONCONTACTS} className="button--primary mtauto">
                                {c('Action').t`Import contacts`}
                            </AppLink>
                        ),
                    },
                    {
                        icon: 'calendar',
                        text: c('Info').t`Import your entire calendar or individual events into ProtonCalendar.`,
                        link: (
                            <AppLink
                                to="/settings/calendars"
                                toApp={APPS.PROTONCALENDAR}
                                className="button--primary mtauto"
                            >
                                {c('Action').t`Import calendar`}
                            </AppLink>
                        ),
                    },
                ]}
            />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default ImportContainer;
