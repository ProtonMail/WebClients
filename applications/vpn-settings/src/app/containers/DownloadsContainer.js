import React from 'react';
import { c } from 'ttag';

import Page from '../components/page/Page';
import { ProtonVPNClientsSection, OpenVPNConfigurationSection } from 'react-components';

export const getDownloadsPage = () => {
    return {
        text: c('Title').t`Downloads`,
        route: '/downloads',
        icon: 'download',
        sections: [
            {
                text: c('Title').t`ProtonVPN clients`,
                id: 'protonvpn-clients'
            },
            {
                text: c('Title').t`OpenVPN configuration files`,
                id: 'openvpn-configuration-files'
            }
        ]
    };
};

const DownloadsContainer = () => {
    return (
        <Page config={getDownloadsPage()}>
            <ProtonVPNClientsSection />
            <OpenVPNConfigurationSection />
        </Page>
    );
};

export default DownloadsContainer;
