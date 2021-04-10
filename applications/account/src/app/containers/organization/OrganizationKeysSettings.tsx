import React from 'react';
import {
    OrganizationPasswordSection,
    OrganizationSection,
    SettingsPropsShared,
    useOrganization,
} from 'react-components';
import { c } from 'ttag';
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
                id: 'password-keys',
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
    const [organization] = useOrganization();

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getOrganizationPage()}
            setActiveSection={() => {}}
        >
            <OrganizationSection organization={organization} />
            <OrganizationPasswordSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationKeysSettings;
