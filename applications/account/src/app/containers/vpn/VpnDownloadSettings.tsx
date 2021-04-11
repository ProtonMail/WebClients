import React from 'react';
import { c } from 'ttag';
import { SettingsPropsShared } from 'react-components';
import DownloadVPNClientSection from './DownloadVPNClientSection';

import PrivateMainSettingsAreaWithPermissions from '../../content/PrivateMainSettingsAreaWithPermissions';
import VpnDownloadCardForContentTeam from './DownloadCardForContentTeam';

export const getDownloadsPage = () => {
    return {
        text: c('Title').t`Downloads`,
        to: '/vpn/download',
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
            <VpnDownloadCardForContentTeam />
            <DownloadVPNClientSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default VpnDownloadSettings;
