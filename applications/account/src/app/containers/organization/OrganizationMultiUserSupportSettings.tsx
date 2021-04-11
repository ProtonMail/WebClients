import React, { useEffect, useRef } from 'react';
import { c } from 'ttag';
import {
    SettingsPropsShared,
    OrganizationSection,
    useUser,
    useOrganization,
    useOrganizationKey,
    useModals,
} from 'react-components';
import { getOrganizationKeyInfo } from 'react-components/containers/organization/helpers/organizationKeysHelper';
import ReactivateOrganizationKeysModal, {
    MODES,
} from 'react-components/containers/organization/ReactivateOrganizationKeysModal';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { Organization } from 'proton-shared/lib/interfaces';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN, MULTI_USERS, NOT_SUB_USER } = PERMISSIONS;

export const getMultiUserSupportPage = (organization: Organization) => {
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
        ],
    };
};

const OrganizationMultiUserSupportSettings = ({ location }: SettingsPropsShared) => {
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
        <PrivateMainSettingsAreaWithPermissions location={location} config={getMultiUserSupportPage(organization)}>
            <OrganizationSection organization={organization} />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationMultiUserSupportSettings;
