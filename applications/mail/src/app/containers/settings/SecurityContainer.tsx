import React from 'react';
import {
    AddressVerificationSection,
    ExternalPGPSettingsSection,
    AddressKeysSection,
    UserKeysSection,
    SettingsPropsShared,
} from 'react-components';
import { c } from 'ttag';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getSecurityPage = () => {
    return {
        text: c('Title').t`Security & keys`,
        to: '/settings/security',
        icon: 'security',
        subsections: [
            {
                text: c('Title').t`Address verification`,
                id: 'address-verification',
            },
            {
                text: c('Title').t`External PGP settings`,
                id: 'pgp-settings',
            },
            {
                text: c('Title').t`Email encryption keys`,
                id: 'addresses',
            },
            {
                text: c('Title').t`Contact encryption keys`,
                id: 'user',
            },
        ],
    };
};

const SecurityContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getSecurityPage()}
            setActiveSection={setActiveSection}
        >
            <AddressVerificationSection />
            <ExternalPGPSettingsSection />
            <AddressKeysSection />
            <UserKeysSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default SecurityContainer;
