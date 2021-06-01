import React, { useEffect, useRef } from 'react';
import { c } from 'ttag';
import {
    SettingsPropsShared,
    useUser,
    useOrganization,
    useOrganizationKey,
    useModals,
    OrganizationSection,
    OrganizationPasswordSection,
} from 'react-components';
import { getOrganizationKeyInfo } from 'react-components/containers/organization/helpers/organizationKeysHelper';
import ReactivateOrganizationKeysModal, {
    MODES,
} from 'react-components/containers/organization/ReactivateOrganizationKeysModal';
import { PERMISSIONS } from 'proton-shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN, MULTI_USERS, NOT_SUB_USER } = PERMISSIONS;

export const getOrganizationPage = () => {
    return {
        text: c('Title').t`Organization & Keys`,
        to: '/organization-keys',
        icon: 'organization',
        permissions: [ADMIN, NOT_SUB_USER],
        subsections: [
            {
                text: c('Title').t`Organization`,
                id: 'organization',
                permissions: [MULTI_USERS],
            },
            {
                text: c('Title').t`Password & Keys`,
                id: 'password-keys',
                permissions: [MULTI_USERS],
            },
        ],
    };
};

const OrganizationKeysSettings = ({ location }: SettingsPropsShared) => {
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
            config={getOrganizationPage()}
            setActiveSection={() => {}}
        >
            <OrganizationSection
                organization={organization}
                onSetupOrganization={() => {
                    // Disable automatic activation modal when setting up an organization
                    onceRef.current = true;
                }}
            />
            <OrganizationPasswordSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationKeysSettings;
