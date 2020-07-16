import React from 'react';
import {
    OrganizationSection,
    MembersSection,
    OrganizationPasswordSection,
    DomainsSection,
    SettingsPropsShared,
} from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN } = PERMISSIONS;

export const getOrganizationPage = () => {
    return {
        text: c('Title').t`Organization`,
        to: '/organization',
        icon: 'organization',
        permissions: [ADMIN],
        subsections: [
            {
                text: c('Title').t`Multi-user support`,
                id: 'name',
            },
            {
                text: c('Title').t`Password and key`,
                id: 'password',
            },
            {
                text: c('Title').t`Users`,
                id: 'members',
            },
            {
                text: c('Title').t`Custom domains`,
                id: 'domains',
            },
        ],
    };
};

const OrganizationContainer = ({ location, setActiveSection }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getOrganizationPage()}
            setActiveSection={setActiveSection}
        >
            <OrganizationSection />
            <OrganizationPasswordSection />
            <MembersSection />
            <DomainsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationContainer;
