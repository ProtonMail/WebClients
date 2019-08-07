import React from 'react';
import { c } from 'ttag';

import Page from '../components/page/Page';
import ProtonVPNClientsSection from './vpn/ProtonVPNClientsSection';
import OpenVPNConfigurationSection from './vpn/OpenVPNConfigurationSection';
import { SubSidebar } from 'react-components';

export const getDownloadsPageSections = () => [
    {
        text: c('Title').t`ProtonVPN Clients`,
        id: 'protonvpn-clients'
    },
    {
        text: c('Title').t`OpenVPN Configuration Files`,
        id: 'openvpn-configuration-files'
    }
];

const DownloadsContainer = () => {
    return (
        <>
            <SubSidebar list={getDownloadsPageSections()} />
            <Page title={c('Title').t`Downloads`}>
                <ProtonVPNClientsSection />
                <OpenVPNConfigurationSection />
            </Page>
        </>
    );
};

export default DownloadsContainer;
