import React from 'react';
import { c } from 'ttag';
import { SettingsPropsShared, OrganizationSection, useOrganization } from '@proton/components';
import { PERMISSIONS } from '@proton/shared/lib/constants';
import { Organization } from '@proton/shared/lib/interfaces';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { MULTI_USERS } = PERMISSIONS;

export const getMultiUserSupportPage = (organization: Organization) => {
    return {
        text: c('Title').t`Organization`,
        to: '/organization',
        icon: 'organization',
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
    const [organization] = useOrganization();
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getMultiUserSupportPage(organization)}>
            <OrganizationSection organization={organization} />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationMultiUserSupportSettings;
