import React from 'react';
import { CatchAllSection, DomainsSection, SettingsPropsShared } from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN, NOT_SUB_USER } = PERMISSIONS;

export const getOrganizationPage = () => {
    return {
        text: c('Title').t`Domain names`,
        to: '/domain-names',
        icon: 'globe',
        permissions: [ADMIN, NOT_SUB_USER],
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
