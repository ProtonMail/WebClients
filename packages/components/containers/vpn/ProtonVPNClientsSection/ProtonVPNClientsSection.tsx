import React from 'react';
import { c } from 'ttag';
import VPNClientCard from './VPNClientCard';

const ProtonVPNClientsSection = () => {
    return (
        <div className="flex onmobile-flex-column">
            <VPNClientCard
                title={c('VPNClient').t`Android`}
                icon="android"
                link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_source=protonvpn.com&utm_content=dashboard"
            />
            <VPNClientCard
                title={c('VPNClient').t`iOS`}
                icon="apple"
                link="https://itunes.apple.com/us/app/protonvpn-fast-secure-vpn/id1437005085"
            />
            <VPNClientCard title={c('VPNClient').t`Windows`} icon="windows" link="https://protonvpn.com/download/" />
            <VPNClientCard title={c('VPNClient').t`macOS`} icon="apple" link="https://protonvpn.com/download/" />
            <VPNClientCard
                title={c('VPNClient').t`GNU/Linux`}
                icon="linux"
                link=" https://protonvpn.com/support/official-linux-client/"
            />
            <VPNClientCard
                title={c('VPNClient').t`ChromeBook`}
                icon="chrome"
                link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_source=protonvpn.com&utm_content=dashboard"
            />
            <VPNClientCard
                title={c('VPNClient').t`Android TV`}
                icon="tv"
                link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_source=protonvpn.com&utm_content=dashboard"
            />
        </div>
    );
};

export default ProtonVPNClientsSection;
