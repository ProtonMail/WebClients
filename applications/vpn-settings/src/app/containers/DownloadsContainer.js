import React from 'react';
import { c } from 'ttag';

import Page from '../components/page/Page';
import ProtonVPNClientsSection from './vpn/ProtonVPNClientsSection';
import OpenVPNConfigurationSection from './vpn/OpenVPNConfigurationSection';

const DownloadsContainer = () => {
    return (
        <Page title={c('Title').t`Downloads`}>
            <ProtonVPNClientsSection />
            <OpenVPNConfigurationSection />
        </Page>
    );
};

export default DownloadsContainer;
