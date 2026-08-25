import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import type { DashboardMoreInfoSection } from '@proton/components/containers/account/dashboard/shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import {
    DashboardMoreInfoSectionTag,
    DashboardMoreInfoSections,
} from '@proton/components/containers/account/dashboard/shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import { useSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getTelemetryUserTier } from '@proton/components/helpers/getTelemetryUserTier';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasAnyPlusWithoutVPN } from '@proton/payments/core/subscription/helpers';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS, VPN_APP_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { hasPaidVpn } from '@proton/shared/lib/user/helpers';
import family from '@proton/styles/assets/img/vpn/download-section/family.svg';
import household from '@proton/styles/assets/img/vpn/download-section/household.svg';
import roundTheClockProtection from '@proton/styles/assets/img/vpn/download-section/round-the-clock-protection.svg';
import sensitiveData from '@proton/styles/assets/img/vpn/download-section/sensitive-data.svg';
import tv from '@proton/styles/assets/img/vpn/download-section/tv.svg';

export const GetMoreSection = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const telemetryFlow = useDashboardPaymentFlow(APPS.PROTONVPN_SETTINGS);
    const openSubscriptionModal = useSubscriptionModalRaw();
    const handleUnlimitedUpsell = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.BUNDLE,
            telemetryFlow,
            onMount: () => {
                void sendTelemetryReport({
                    api,
                    delay: false,
                    event: TelemetryAccountDashboardEvents.upsellCtaClick,
                    measurementGroup: TelemetryMeasurementGroups.accountDashboard,
                    dimensions: {
                        app: APPS.PROTONVPN_SETTINGS,
                        cta: 'discover_unlimited_upgrade_section',
                        user_tier: getTelemetryUserTier(user),
                    },
                });
            },
        });
    };

    const userHasPlusPlanWithoutVPN = hasAnyPlusWithoutVPN(subscription);
    const sections: DashboardMoreInfoSection[] = [
        {
            id: 'get-round-clock-protection',
            title: () => c('Blog').t`Get round-the-clock protection`,
            description: () => c('Blog').t`Enable kill switch and auto-connect in your VPN settings.`,
            image: roundTheClockProtection,
            cardAction: undefined,
        },
        {
            id: 'watch-favorite-movies-shows',
            title: () => c('Blog').t`Watch your favorite movies and TV shows`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="watch-shows-label"
                    prefix={<VpnLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.VPN2024]}
                />
            ),
            description: () =>
                hasPaidVpn(user)
                    ? getBoldFormattedText(c('Blog').t`**Streaming** is included in your subscription.`)
                    : c('Blog').t`Stream from all major platforms with ${PLAN_NAMES[PLANS.VPN2024]}.`,
            image: tv,
            link: !hasPaidVpn(user) ? '/vpn/upgrade' : undefined,
            cardAction: !hasPaidVpn(user) ? 'internal_nav' : undefined,
        },
        {
            id: 'working-sensitive-data',
            title: () => c('Blog').t`Working with sensitive data?`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="sensitive-data-label"
                    prefix={<VpnLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.VPN_BUSINESS]}
                />
            ),
            description: () =>
                c('Blog').t`Protect your company from data breaches and make remote work safer with an enterprise VPN.`,
            image: sensitiveData,
            link: 'https://proton.me/business/vpn',
            cardAction: 'external_link',
        },
        userHasPlusPlanWithoutVPN
            ? {
                  id: 'connect-device-at-once',
                  title: () => c('Blog').t`Connect ${VPN_CONNECTIONS} devices at once`,
                  tag: (
                      <DashboardMoreInfoSectionTag
                          key="connect-10-devices-label"
                          prefix={<VpnLogo variant="glyph-only" size={5} />}
                          text={PLAN_NAMES[PLANS.BUNDLE]}
                      />
                  ),
                  description: () =>
                      c('Blog')
                          .t`Protect all your household devices at the same time with ${PLAN_NAMES[PLANS.BUNDLE]}.`,
                  image: family,
                  onClick: () => handleUnlimitedUpsell(),
                  cardAction: 'upsell_modal',
              }
            : {
                  id: 'protect-your-household',
                  title: () => c('Blog').t`Protect your whole household with 1 device`,
                  tag: <DashboardMoreInfoSectionTag key="advanced-label" text={c('Label').t`Advanced`} />,
                  description: () => c('Blog').t`Learn how to enable ${VPN_APP_NAME} on your router.`,
                  image: household,
                  link: 'https://protonvpn.com/support/installing-protonvpn-on-a-router?srsltid=AfmBOop2RjZzvRqhNW0eEQaVNEr1LMgRGdbHuLcvuZ1owoKhK-1iEGqS',
                  cardAction: 'external_link',
              },
    ];

    return <DashboardMoreInfoSections sections={sections} app={APPS.PROTONVPN_SETTINGS} />;
};
