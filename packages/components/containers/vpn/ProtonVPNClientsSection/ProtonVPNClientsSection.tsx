import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';

import type { ModalProps } from '../../../components';
import { Copy, DownloadClientCard, ModalTwo, ModalTwoContent } from '../../../components';
import { useNotifications, useWelcomeFlags } from '../../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../../account';
import { OnboardingContent } from '../../onboarding';

interface DownloadModalProps extends ModalProps {
    downloadUrl: string;
}

const DownloadModal = ({ downloadUrl, ...rest }: DownloadModalProps) => {
    return (
        <ModalTwo {...rest} size="small">
            <ModalTwoContent className="m-8 text-center">
                <OnboardingContent
                    img={<img src={onboardingVPNWelcome} alt={getWelcomeToText(VPN_APP_NAME)} />}
                    title={c('Title').t`Download ${VPN_APP_NAME}`}
                    description={c('Info').t`The securest way to browse, stream, and be online.`}
                />
                <ButtonLike
                    as={Href}
                    color="norm"
                    size="large"
                    target="_blank"
                    href={downloadUrl}
                    fullWidth
                    onClick={() => {
                        rest.onClose?.();
                    }}
                    className="mb-2"
                >{c('Action').t`Download`}</ButtonLike>
                <Button color="norm" size="large" fullWidth shape="ghost" onClick={rest.onClose}>
                    {c('Action').t`Close`}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};

const ProtonVPNClientsSection = () => {
    const history = useHistory();
    const location = useLocation();
    const [, setDone] = useWelcomeFlags();
    const { createNotification } = useNotifications();

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
            <div className="flex items-center overflow-hidden" key={children}>
                <DropdownMenuLink className="flex-1" href={href}>
                    {children}
                </DropdownMenuLink>
                <Copy
                    shape="ghost"
                    value={href}
                    className="shrink-0 mr-2"
                    onCopy={() => {
                        createNotification({
                            text: c('Success').t`Link copied to clipboard`,
                        });
                    }}
                />
            </div>
        );
    });

    return (
        <SettingsSectionWide>
            <DownloadModal
                downloadUrl="https://protonvpn.com/download"
                open={location.search.includes('prompt')}
                onClose={() => {
                    history.replace({ ...location, search: '' });
                    setDone();
                }}
            />
            <SettingsParagraph>
                {c('Info')
                    .t`To secure your internet connection, download and install the ${VPN_APP_NAME} application for your device and connect to a server.`}
            </SettingsParagraph>
            <div className="flex gap-4 flex-column md:flex-row">
                <DownloadClientCard
                    title={c('VPNClient').t`Android`}
                    icon="brand-android"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_campaign=ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard&utm_source=account.protonvpn.com&utm_medium=link&utm_content=dashboard&utm_term=android"
                    items={androidLinks}
                />
                <DownloadClientCard
                    title={c('VPNClient').t`iOS`}
                    icon="brand-apple"
                    link="https://apps.apple.com/app/apple-store/id1437005085?pt=106513916&ct=protonvpn.com-dashboard&mt=8"
                />
                <DownloadClientCard
                    title={c('VPNClient').t`Windows`}
                    icon="brand-windows"
                    link="https://protonvpn.com/download-windows/"
                />
                <DownloadClientCard
                    title={c('VPNClient').t`macOS`}
                    icon="brand-mac"
                    link="https://protonvpn.com/download-macos/"
                />
                <DownloadClientCard
                    title={c('VPNClient').t`GNU/Linux`}
                    icon="brand-linux"
                    link="https://protonvpn.com/download-linux/"
                />
                <DownloadClientCard
                    title={c('VPNClient').t`Chromebook`}
                    icon="brand-chrome"
                    link="https://play.google.com/store/apps/details?id=ch.protonvpn.android&utm_campaign=ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard&utm_source=account.protonvpn.com&utm_medium=link&utm_content=dashboard&utm_term=chromebook"
                    items={androidLinks}
                />
                <DownloadClientCard
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
