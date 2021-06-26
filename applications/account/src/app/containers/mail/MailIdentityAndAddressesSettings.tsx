import React from 'react';
import { c } from 'ttag';
import { AddressesSection, IdentitySection, SettingsPropsShared } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getAddressesPage = () => {
    return {
        text: c('Title').t`Identity & addresses`,
        to: '/mail/identity-addresses',
        icon: 'addresses',
        subsections: [
            {
                text: c('Title').t`Display name & signature`,
                id: 'name-signature',
            },
            {
                text: c('Title').t`My addresses`,
                id: 'addresses',
            },
        ],
    };
};

const MailIdentityAndAddressSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getAddressesPage()}>
            <IdentitySection />
            <AddressesSection isOnlySelf />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailIdentityAndAddressSettings;
