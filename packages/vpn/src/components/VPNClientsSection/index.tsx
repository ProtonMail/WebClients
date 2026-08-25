import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import Copy from '@proton/components/components/button/Copy';
import DownloadClientCard from '@proton/components/components/downloadClientCard/DownloadClientCard';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { getTelemetryUserTier } from '@proton/components/helpers/getTelemetryUserTier';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { appendUrlSearchParams } from '@proton/shared/lib/helpers/url';
import { VPN_MOBILE_APP_LINKS } from '@proton/shared/lib/vpn/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { androidMarketplaceUrl, iosMarketplaceUrl } from '../../../constants/downloadLinks';
import { useFetchDownloadLinks } from '../../hooks/useFetchDownloadLinks';
import DownloadModal from './DownloadModal';
import { FeedbackSurveyModal } from './FeedbackSurveyModal';
import { FeedbackSurveyModalWrapper } from './FeedbackSurveyModalWrapper';

const LinkItem = ({ href, text, onClick }: { href: string; text: string; onClick?: () => void }) => {
    const { createNotification } = useNotifications();

    return (
        <div className="flex items-center overflow-hidden" key={text}>
            <DropdownMenuLink className="flex-1" href={href} onClick={onClick}>
                {text}
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
};

const FIVE_MINUTES = 5 * 60 * 1000;

export const VPNClientsSection = () => {
    const api = useApi();
    const history = useHistory();
    const location = useLocation();
    const { createNotification } = useNotifications();
    const [user] = useUser();

    const handleDownloadClick = (destination: string) => {
        void sendTelemetryReport({
            api,
            delay: false,
            event: TelemetryAccountDashboardEvents.downloadCtaClick,
            measurementGroup: TelemetryMeasurementGroups.accountDashboard,
            dimensions: {
                app: APPS.PROTONVPN_SETTINGS,
                download_destination: destination.toLowerCase(),
                user_tier: getTelemetryUserTier(user),
            },
        });
    };
    // We only want to display the survey when the user just created the account && it is not a free user
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(() => {
        if (!user.hasPaidVpn) {
            return false;
        }

        const seen = getItem('vpn-feedback-modal') === 'seen';
        if (seen) {
            return false;
        }

        setItem('vpn-feedback-modal', 'seen', { ttl: FIVE_MINUTES });
        return Date.now() - user.CreateTime * 1000 < FIVE_MINUTES;
    });

    const handleOnCloseFeedbackModal = (discarded: boolean) => {
        setIsFeedbackModalOpen(false);
        if (!discarded) {
            createNotification({
                text: c('Info').t`Thanks for the feedback!`,
            });
        }
    };

    const androidLinks = [
        {
            href: 'https://protonvpn.com/download/ProtonVPN.apk',
            text: 'APK',
        },
        {
            href: 'https://github.com/ProtonVPN/android-app/releases',
            text: 'GitHub',
        },
        {
            href: 'https://f-droid.org/en/packages/ch.protonvpn.android/',
            text: 'F-Droid',
        },
    ].map(LinkItem);

    const isDesktopDownloadApiEnabled = useFlag('DesktopDownloadApiEnabled');
    const links = useFetchDownloadLinks(isDesktopDownloadApiEnabled);

    return (
        <SettingsSectionWide>
            <DownloadModal
                downloadUrl="https://protonvpn.com/download"
                open={location.search.includes('prompt')}
                onClose={() => {
                    history.replace({ ...location, search: '' });
                }}
            />
            <FeedbackSurveyModalWrapper>
                <FeedbackSurveyModal open={isFeedbackModalOpen} onClose={handleOnCloseFeedbackModal} />
            </FeedbackSurveyModalWrapper>
            <SettingsParagraph>
                {c('Info')
                    .t`To secure your internet connection, download and install the ${VPN_APP_NAME} application for your device and connect to a server.`}
            </SettingsParagraph>
            <div className="flex gap-4 flex-column md:flex-row">
                <DownloadClientCard
                    title={c('VPNClient').t`Android`}
                    icon="brand-android"
                    link={androidMarketplaceUrl}
                    items={androidLinks}
                    onClick={() => handleDownloadClick('google_play')}
                />
                <DownloadClientCard
                    title={c('VPNClient').t`iOS`}
                    icon="brand-apple"
                    link={iosMarketplaceUrl}
                    onClick={() => handleDownloadClick('app_store')}
                />
                <DownloadClientCard
                    title={c('VPNClient').t`Windows`}
                    icon="brand-windows"
                    link="https://protonvpn.com/download-windows/"
                    items={links.windows?.map(({ title, link: href }) => (
                        <LinkItem
                            key={title()}
                            text={title()}
                            href={href}
                            onClick={() => handleDownloadClick('windows')}
                        />
                    ))}
                    onClick={() => handleDownloadClick('windows')}
                />
                <DownloadClientCard
                    title={c('VPNClient').t`macOS`}
                    icon="brand-mac"
                    link="https://protonvpn.com/download-macos/"
                    items={links.mac?.map(({ title, link: href }) => (
                        <LinkItem
                            key={title()}
                            text={title()}
                            href={href}
                            onClick={() => handleDownloadClick('macos')}
                        />
                    ))}
                    onClick={() => handleDownloadClick('macos')}
                />
                <DownloadClientCard
                    title={c('VPNClient').t`GNU/Linux`}
                    icon="brand-linux"
                    link={
                        isDesktopDownloadApiEnabled
                            ? 'https://protonvpn.com/support/linux-vpn-setup'
                            : 'https://protonvpn.com/download-linux/'
                    }
                    onClick={() => handleDownloadClick('linux')}
                />
                <DownloadClientCard
                    title={c('VPNClient').t`Chromebook`}
                    icon="brand-chrome"
                    link={appendUrlSearchParams(VPN_MOBILE_APP_LINKS.playStore, {
                        utm_campaign: 'ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard',
                        utm_source: 'account.protonvpn.com',
                        utm_medium: 'link',
                        utm_content: 'dashboard',
                        utm_term: 'chromebook',
                    })}
                    items={androidLinks}
                    onClick={() => handleDownloadClick('chrome')}
                />
                <DownloadClientCard
                    title={c('VPNClient').t`Android TV`}
                    icon="tv"
                    link={appendUrlSearchParams(VPN_MOBILE_APP_LINKS.playStore, {
                        utm_campaign: 'ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard',
                        utm_source: 'account.protonvpn.com',
                        utm_medium: 'link',
                        utm_content: 'dashboard',
                        utm_term: 'androidtv',
                    })}
                    items={androidLinks}
                    onClick={() => handleDownloadClick('google_play')}
                />
            </div>
        </SettingsSectionWide>
    );
};
