import React from 'react';
import { Row, SubTitle } from 'react-components';
import { c } from 'ttag';
import VPNClientCard from './VPNClientCard';

const ProtonVPNClientsSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`ProtonVPN Clients`}</SubTitle>
            <Row className="flex-autogrid">
                <VPNClientCard
                    title="Android"
                    icon="android"
                    link="https://play.google.com/store/apps/details?id=com.protonvpn.android"
                />
                <VPNClientCard
                    title="iOS"
                    icon="apple"
                    link="https://itunes.apple.com/us/app/protonvpn-fast-secure-vpn/id1437005085"
                />
                <VPNClientCard title="Windows" icon="windows" link="https://protonvpn.com/download/" />
                <VPNClientCard title="MacOS" icon="apple" link="https://protonvpn.com/download/" />
                <VPNClientCard title="Linux" icon="linux" link="https://protonvpn.com/support/linux-vpn-setup/" />
            </Row>
        </>
    );
};

export default ProtonVPNClientsSection;
