import React from 'react';
import { c } from 'ttag';

import Page from '../components/page/Page';
import { SubSidebar, ObserverSections, ProtonVPNClientsSection, OpenVPNConfigurationSection } from 'react-components';

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
