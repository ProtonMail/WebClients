import React from 'react';
import {
    OrganizationSection,
    MembersSection,
    OrganizationPasswordSection,
    DomainsSection,
    AddressesSection,
    CatchAllSection,
    SettingsPropsShared,
    useOrganization,
} from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { Organization } from 'proton-shared/lib/interfaces';

import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN, MULTI_USERS } = PERMISSIONS;

export const getOrganizationPage = (organization: Organization) => {
    return {
        text: c('Title').t`Organization`,
        to: '/organization',
        icon: 'organization',
        permissions: [ADMIN],
        subsections: [
            {
                text:
                    organization && organization.HasKeys
                        ? c('Title').t`Organization`
                        : c('Title').t`Multi-user support`,
                id: 'name',
                permissions: [MULTI_USERS],
            },
            {
                text: c('Title').t`Password & key`,
                id: 'password',
                permissions: [MULTI_USERS],
            },
            {
                text: c('Title').t`Users`,
                id: 'members',
                permissions: [MULTI_USERS],
            },
            {
                text: c('Title').t`Custom domains`,
                id: 'domains',
            },
            {
                text: c('Title').t`Catch-all address`,
                id: 'catch-all',
            },
            {
                text: c('Title').t`Addresses`,
                id: 'addresses',
            },
        ],
    };
};

const OrganizationContainer = ({ location, setActiveSection }: SettingsPropsShared) => {
    const [organization] = useOrganization();
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getOrganizationPage(organization)}
            setActiveSection={setActiveSection}
        >
            <OrganizationSection organization={organization} />
            <OrganizationPasswordSection />
            <MembersSection />
            <DomainsSection />
            <CatchAllSection />
            <AddressesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationContainer;
