import React from 'react';
import { c } from 'ttag';
import { SettingsPropsShared, ProtonAccountOpenVpnConfigurationFiles } from 'react-components';
import OpenVPNCredentialSection from './OpenVpnCredentialSection';

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

const VpnOpenVpnIKEv2 = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getOpenVpnIKEv2Page()}
            setActiveSection={setActiveSection}
        >
            <OpenVPNCredentialSection />
            <ProtonAccountOpenVpnConfigurationFiles />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default VpnOpenVpnIKEv2;
