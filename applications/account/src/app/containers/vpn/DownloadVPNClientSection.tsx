import React from 'react';
import { c } from 'ttag';
import { SettingsSectionWide, SettingsParagraph } from 'react-components';
import DownloadVPNClientCard from './DownloadVPNClientCard';

const DownloadVPNClientSection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`To secure your internet connection, download and install the ProtonVPN application for your device and connect to a ProtonVPN server.`}
            </SettingsParagraph>
            <div className="flex on-mobile-flex-column">
                <DownloadVPNClientCard
                    title={c('VPNClient').t`Android`}
                    icon="android"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_source=protonvpn.com&utm_content=dashboard"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`iOS`}
                    icon="apple"
                    link="https://itunes.apple.com/us/app/protonvpn-fast-secure-vpn/id1437005085"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`Windows`}
                    icon="windows"
                    link="https://protonvpn.com/download-windows/"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`macOS`}
                    icon="macos"
                    link="https://protonvpn.com/download-macos/"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`GNU/Linux`}
                    icon="linux"
                    link="https://protonvpn.com/download-linux/"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`ChromeBook`}
                    icon="chrome"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_source=protonvpn.com&utm_content=dashboard"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`Android TV`}
                    icon="tv"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_source=protonvpn.com&utm_content=dashboard"
                />
            </div>
        </SettingsSectionWide>
    );
};

export default DownloadVPNClientSection;
