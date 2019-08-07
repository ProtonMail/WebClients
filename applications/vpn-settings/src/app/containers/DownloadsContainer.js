import React from 'react';
import { c } from 'ttag';

import Page from '../components/page/Page';
import ProtonVPNClientsSection from './vpn/ProtonVPNClientsSection';
import OpenVPNConfigurationSection from './vpn/OpenVPNConfigurationSection';
import { SubSidebar, ObserverSections } from 'react-components';

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
                <ObserverSections>
                    <ProtonVPNClientsSection id="protonvpn-clients" />
                    <OpenVPNConfigurationSection id="openvpn-configuration-files" />
                </ObserverSections>
            </Page>
        </>
    );
};

export default DownloadsContainer;
