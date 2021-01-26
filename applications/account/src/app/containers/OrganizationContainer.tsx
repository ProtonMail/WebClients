import React, { useEffect, useRef } from 'react';
import {
    OrganizationSection,
    MembersSection,
    OrganizationPasswordSection,
    DomainsSection,
    AddressesSection,
    CatchAllSection,
    SettingsPropsShared,
    useOrganization,
    useOrganizationKey,
    useModals,
    useUser,
} from 'react-components';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { Organization } from 'proton-shared/lib/interfaces';
import { getOrganizationKeyInfo } from 'react-components/containers/organization/helpers/organizationKeysHelper';
import ReactivateOrganizationKeysModal, {
    MODES,
} from 'react-components/containers/organization/ReactivateOrganizationKeysModal';

import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN, MULTI_USERS, NOT_SUB_USER } = PERMISSIONS;

export const getOrganizationPage = (organization: Organization) => {
    return {
        text: c('Title').t`Organization`,
        to: '/organization',
        icon: 'organization',
        permissions: [ADMIN, NOT_SUB_USER],
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
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const onceRef = useRef(false);
    const { createModal } = useModals();

    useEffect(() => {
        if (
            onceRef.current ||
            !organization ||
            loadingOrganization ||
            !organizationKey ||
            loadingOrganizationKey ||
            !user.isAdmin ||
            !organization.HasKeys
        ) {
            return;
        }
        const { hasOrganizationKey, isOrganizationKeyInactive } = getOrganizationKeyInfo(organizationKey);
        if (!hasOrganizationKey) {
            createModal(<ReactivateOrganizationKeysModal mode={MODES.ACTIVATE} />);
            onceRef.current = true;
        }
        if (isOrganizationKeyInactive) {
            createModal(<ReactivateOrganizationKeysModal mode={MODES.REACTIVATE} />);
            onceRef.current = true;
        }
    }, [organization, organizationKey, user]);

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
