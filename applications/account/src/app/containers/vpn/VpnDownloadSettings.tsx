import React from 'react';
import { c } from 'ttag';
import { SettingsPropsShared } from 'react-components';
import DownloadVPNClientSection from './DownloadVPNClientSection';

import PrivateMainSettingsAreaWithPermissions from '../../content/PrivateMainSettingsAreaWithPermissions';
import VpnUpgradeSection from './VpnUpgradeSection';

export const getDownloadsPage = () => {
    return {
        text: c('Title').t`VPN apps`,
        to: '/vpn/vpn-apps',
        icon: 'download',
        subsections: [
            {
                text: '',
                id: '',
            },
            {
                text: c('Title').t`ProtonVPN`,
                id: 'protonvpn-clients',
            },
        ],
    };
};

const VpnDownloadSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getDownloadsPage()}
            setActiveSection={setActiveSection}
        >
            <VpnUpgradeSection />
            <DownloadVPNClientSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default VpnDownloadSettings;
