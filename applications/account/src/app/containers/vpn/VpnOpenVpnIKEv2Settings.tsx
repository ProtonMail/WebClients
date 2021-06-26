import React from 'react';
import { c } from 'ttag';
import { SettingsPropsShared, OpenVPNCredentialsSection, OpenVPNConfigurationSection } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../content/PrivateMainSettingsAreaWithPermissions';

export const getOpenVpnIKEv2Page = () => {
    return {
        text: c('Title').t`OpenVPN / IKEv2`,
        to: 'vpn/OpenVpnIKEv2',
        icon: 'keys',
        subsections: [
            {
                text: c('Title').t`Credentials`,
                id: 'openvpn',
            },
            {
                text: c('Title').t`OpenVPN configuration files`,
                id: 'openvpn-configuration-files',
            },
        ],
    };
};

const VpnOpenVpnIKEv2Settings = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getOpenVpnIKEv2Page()}
            setActiveSection={setActiveSection}
        >
            <OpenVPNCredentialsSection app="account" />
            <OpenVPNConfigurationSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default VpnOpenVpnIKEv2Settings;
