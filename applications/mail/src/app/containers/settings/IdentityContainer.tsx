import React from 'react';
import { IdentitySection, ProtonFooterSection, SettingsPropsShared } from 'react-components';
import { c } from 'ttag';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getIdentityPage = () => {
    return {
        text: c('Title').t`Identity`,
        to: '/settings/identity',
        icon: 'identity',
        subsections: [
            {
                text: c('Title').t`Display name & signature`,
                id: 'name-signature',
            },
            {
                text: c('Title').t`Signature footer `,
                id: 'proton-footer',
            },
        ],
    };
};

const IdentityContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getIdentityPage()}
            setActiveSection={setActiveSection}
        >
            <IdentitySection />
            <ProtonFooterSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default IdentityContainer;
