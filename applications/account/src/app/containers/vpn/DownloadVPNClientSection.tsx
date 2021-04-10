import React from 'react';
import { c } from 'ttag';
import { SettingsSectionWide, SettingsParagraph } from 'react-components';
import DownloadVPNClientCard from './DownloadVPNClientCard';

const DownloadVPNClientSection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`To start securing your internet connection, you need to install ProtonVPN application for your device and connect to ProtonVPN server.`}
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
                    link="https://protonvpn.com/download/"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`macOS`}
                    icon="apple"
                    link="https://protonvpn.com/download/"
                />
                <DownloadVPNClientCard
                    title={c('VPNClient').t`GNU/Linux`}
                    icon="linux"
                    link=" https://protonvpn.com/support/official-linux-client/"
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
                <DownloadVPNClientCard textExample icon="contacts-group-people" />
            </div>
        </SettingsSectionWide>
    );
};

export default DownloadVPNClientSection;
