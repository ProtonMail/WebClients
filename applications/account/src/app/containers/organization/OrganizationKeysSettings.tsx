import { useRef } from 'react';
import { c } from 'ttag';
import {
    SettingsPropsShared,
    useOrganization,
    OrganizationSection,
    OrganizationPasswordSection,
} from '@proton/components';
import { PERMISSIONS } from '@proton/shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const { ADMIN, MULTI_USERS, NOT_SUB_USER } = PERMISSIONS;

export const getOrganizationPage = () => {
    return {
        text: c('Title').t`Organization & keys`,
        to: '/organization-keys',
        icon: 'buildings',
        permissions: [ADMIN, NOT_SUB_USER],
        subsections: [
            {
                text: c('Title').t`Organization`,
                id: 'organization',
                permissions: [MULTI_USERS],
            },
            {
                text: c('Title').t`Password & keys`,
                id: 'password-keys',
                permissions: [MULTI_USERS],
            },
        ],
    };
};

const OrganizationKeysSettings = ({ location }: SettingsPropsShared) => {
    const [organization] = useOrganization();
    const onceRef = useRef(false);
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
            <OrganizationPasswordSection organization={organization} onceRef={onceRef} />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default OrganizationKeysSettings;
