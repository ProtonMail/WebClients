import React from 'react';
import PropTypes from 'prop-types';
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

const DownloadsContainer = ({ setActiveSection }) => {
    return (
        <Page config={getDownloadsPage()} setActiveSection={setActiveSection}>
            <ProtonVPNClientsSection />
            <OpenVPNConfigurationSection />
        </Page>
    );
};

DownloadsContainer.propTypes = {
    setActiveSection: PropTypes.func
};

export default DownloadsContainer;
