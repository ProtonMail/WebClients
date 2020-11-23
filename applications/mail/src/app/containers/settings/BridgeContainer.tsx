import React from 'react';
import { c } from 'ttag';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { ProtonMailBridgeSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

const { PAID_MAIL } = PERMISSIONS;

export const getBridgePage = () => {
    return {
        text: c('Title').t`IMAP/SMTP tool`,
        to: '/settings/bridge',
        icon: 'imap-smtp',
        permissions: [PAID_MAIL],
        subsections: [
            {
                text: c('Title').t`ProtonMail Bridge`,
                id: 'protonmail-bridge',
            },
        ],
    };
};

const BridgeContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getBridgePage()}
            setActiveSection={setActiveSection}
        >
            <ProtonMailBridgeSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default BridgeContainer;
