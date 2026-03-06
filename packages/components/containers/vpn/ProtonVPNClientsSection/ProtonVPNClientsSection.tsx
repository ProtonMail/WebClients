import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import Copy from '@proton/components/components/button/Copy';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useNotifications from '@proton/components/hooks/useNotifications';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { appendUrlSearchParams } from '@proton/shared/lib/helpers/url';
import { VPN_MOBILE_APP_LINKS } from '@proton/shared/lib/vpn/constants';

import DownloadClientCard from '../../../components/downloadClientCard/DownloadClientCard';
import DownloadModal from './DownloadModal/DownloadModal';
import { FeedbackSurveyModal } from './FeedbackSurveyModal/FeedbackSurveyModal';
import { FeedbackSurveyModalWrapper } from './FeedbackSurveyModal/FeedbackSurveyModalWrapper';
import { androidMarketplaceUrl, iosMarketplaceUrl } from './downloadLinks';

const FIVE_MINUTES = 5 * 60 * 1000;

const ProtonVPNClientsSection = () => {
    const history = useHistory();
    const location = useLocation();
    const { createNotification } = useNotifications();
    const [user] = useUser();
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
                />
                <DownloadClientCard title={c('VPNClient').t`iOS`} icon="brand-apple" link={iosMarketplaceUrl} />
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
                    link={appendUrlSearchParams(VPN_MOBILE_APP_LINKS.playStore, {
                        utm_campaign: 'ww-all-2a-vpn-int_webapp-g_eng-apps_links_dashboard',
                        utm_source: 'account.protonvpn.com',
                        utm_medium: 'link',
                        utm_content: 'dashboard',
                        utm_term: 'chromebook',
                    })}
                    items={androidLinks}
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
                />
            </div>
        </SettingsSectionWide>
    );
};

export default ProtonVPNClientsSection;
