import { c } from 'ttag';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import VPNClientCard from './VPNClientCard';
import { DropdownMenuLink, Copy } from '../../../components';
import { SettingsParagraph, SettingsSectionWide } from '../../account';

const ProtonVPNClientsSection = () => {
    const androidLinks = [
        {
            href: 'https://protonvpn.com/download/ProtonVPN.apk',
            children: 'APK',
        },
        {
            href: 'https://github.com/ProtonVPN/android-app/releases',
            children: 'GitHub',
        },
        {
            href: 'https://f-droid.org/en/packages/ch.protonvpn.android/',
            children: 'F-Droid',
        },
    ].map(({ href, children }) => {
        return (
            <div className="flex flex-align-items-center no-scroll" key={children}>
                <DropdownMenuLink className="flex-item-fluid" href={href}>
                    {children}
                </DropdownMenuLink>
                <Copy shape="ghost" value={href} className="flex-item-noshrink mr0-5" />
            </div>
        );
    });

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`To secure your internet connection, download and install the ${VPN_APP_NAME} application for your device and connect to a ${VPN_APP_NAME} server.`}
            </SettingsParagraph>
            <div className="flex on-mobile-flex-column">
                <VPNClientCard
                    title={c('VPNClient').t`Android`}
                    icon="brand-android"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_campaign=ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard&utm_source=account.protonvpn.com&utm_medium=link&utm_content=dashboard&utm_term=android"
                    items={androidLinks}
                />
                <VPNClientCard
                    title={c('VPNClient').t`iOS`}
                    icon="brand-apple"
                    link="https://apps.apple.com/app/apple-store/id1437005085?pt=106513916&ct=protonvpn.com-dashboard&mt=8"
                />
                <VPNClientCard
                    title={c('VPNClient').t`Windows`}
                    icon="brand-windows"
                    link="https://protonvpn.com/download-windows/"
                />
                <VPNClientCard
                    title={c('VPNClient').t`macOS`}
                    icon="brand-apple"
                    link="https://protonvpn.com/download-macos/"
                />
                <VPNClientCard
                    title={c('VPNClient').t`GNU/Linux`}
                    icon="brand-linux"
                    link="https://protonvpn.com/download-linux/"
                />
                <VPNClientCard
                    title={c('VPNClient').t`Chromebook`}
                    icon="brand-chrome"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_campaign=ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard&utm_source=account.protonvpn.com&utm_medium=link&utm_content=dashboard&utm_term=chromebook"
                    items={androidLinks}
                />
                <VPNClientCard
                    title={c('VPNClient').t`Android TV`}
                    icon="tv"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_campaign=ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard&utm_source=account.protonvpn.com&utm_medium=link&utm_content=dashboard&utm_term=androidtv"
                    items={androidLinks}
                />
            </div>
        </SettingsSectionWide>
    );
};

export default ProtonVPNClientsSection;
