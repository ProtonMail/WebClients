import React from 'react';
import { c } from 'ttag';
import { SubTitle } from 'react-components';
import ProtonMailClients from './ProtonMailClients';
import ProtonVPNClients from './ProtonVPNClients';

const DownloadsSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Downloads`}</SubTitle>
            <ProtonMailClients />
            <ProtonVPNClients />
        </>
    );
};

export default DownloadsSection;
