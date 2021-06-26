import React from 'react';
import { SettingsPropsShared, UsersAndAddressesSection } from '@proton/components';
import { c } from 'ttag';
import { PERMISSIONS } from '@proton/shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN, MULTI_USERS, NOT_SUB_USER } = PERMISSIONS;

export const getOrganizationPage = () => {
    return {
        text: c('Title').t`Users and addresses`,
        to: '/organization',
        icon: 'organization',
        permissions: [ADMIN, NOT_SUB_USER],
        subsections: [
            {
                id: 'members',
                permissions: [MULTI_USERS],
            },
            {
                text: c('Title').t`Addresses`,
                id: 'addresses',
            },
        ],
    };
};

const OrganizationUsersAndAddressesSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getOrganizationPage()}
            setActiveSection={() => {}}
        >
            <UsersAndAddressesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationUsersAndAddressesSettings;
