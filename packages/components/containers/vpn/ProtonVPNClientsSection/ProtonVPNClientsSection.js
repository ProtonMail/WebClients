import React from 'react';
import { SubTitle } from 'react-components';
import { c } from 'ttag';
import VPNClientCard from './VPNClientCard';

const ProtonVPNClientsSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`ProtonVPN clients`}</SubTitle>
            <div className="flex onmobile-flex-column">
                <VPNClientCard
                    title={c('VPNClient').t`Android`}
                    icon="android"
                    link="https://play.google.com/store/apps/details?id=com.protonvpn.android"
                />
                <VPNClientCard
                    title={c('VPNClient').t`iOS`}
                    icon="apple"
                    link="https://itunes.apple.com/us/app/protonvpn-fast-secure-vpn/id1437005085"
                />
                <VPNClientCard
                    title={c('VPNClient').t`Windows`}
                    icon="windows"
                    link="https://protonvpn.com/download/"
                />
                <VPNClientCard title={c('VPNClient').t`MacOS`} icon="apple" link="https://protonvpn.com/download/" />
                <VPNClientCard
                    title={c('VPNClient').t`GNU/Linux`}
                    icon="linux"
                    link="https://protonvpn.com/support/linux-vpn-tool/"
                />
            </div>
        </>
    );
};

export default ProtonVPNClientsSection;
