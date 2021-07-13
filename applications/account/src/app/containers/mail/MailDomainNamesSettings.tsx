import React from 'react';
import { CatchAllSection, DomainsSection, SettingsPropsShared } from '@proton/components';
import { c } from 'ttag';
import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getOrganizationPage = () => {
    return {
        text: c('Title').t`Domain names`,
        to: '/domain-names',
        icon: 'globe',
        subsections: [
            { id: 'domains' },
            {
                text: c('Title').t`Catch-all address`,
                id: 'catch-all',
            },
        ],
    };
};

const MailDomainNamesSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getOrganizationPage()}
            setActiveSection={() => {}}
        >
            <DomainsSection />
            <CatchAllSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailDomainNamesSettings;
