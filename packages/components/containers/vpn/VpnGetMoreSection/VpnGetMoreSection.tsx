import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { hasAnyPlusWithoutVPN } from '@proton/payments/core/subscription/helpers';
import { APPS, VPN_APP_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { hasPaidVpn } from '@proton/shared/lib/user/helpers';

import type { DashboardMoreInfoSection } from '../../account/dashboard/shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import {
    DashboardMoreInfoSectionTag,
    DashboardMoreInfoSections,
} from '../../account/dashboard/shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import family from './illustrations/family.svg';
import household from './illustrations/household.svg';
import roundTheClockProtection from './illustrations/round-the-clock-protection.svg';
import sensitiveData from './illustrations/sensitive-data.svg';
import tv from './illustrations/tv.svg';

export const VpnGetMoreSection = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const telemetryFlow = useDashboardPaymentFlow(APPS.PROTONVPN_SETTINGS);
    const [openSubscriptionModal] = useSubscriptionModal();
    const handleUnlimitedUpsell = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.BUNDLE,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const userHasPlusPlanWithoutVPN = hasAnyPlusWithoutVPN(subscription);
    const sections: DashboardMoreInfoSection[] = [
        {
            title: () => c('Blog').t`Get round-the-clock protection`,
            description: () => c('Blog').t`Enable kill switch and auto-connect in your VPN settings.`,
            image: roundTheClockProtection,
        },
        {
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
        },
        {
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
        },
        userHasPlusPlanWithoutVPN
            ? {
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
              }
            : {
                  title: () => c('Blog').t`Protect your whole household with 1 device`,
                  tag: <DashboardMoreInfoSectionTag key="advanced-label" text={c('Label').t`Advanced`} />,
                  description: () => c('Blog').t`Learn how to enable ${VPN_APP_NAME} on your router.`,
                  image: household,
                  link: 'https://protonvpn.com/support/installing-protonvpn-on-a-router?srsltid=AfmBOop2RjZzvRqhNW0eEQaVNEr1LMgRGdbHuLcvuZ1owoKhK-1iEGqS',
              },
    ];

    return <DashboardMoreInfoSections sections={sections} />;
};

export default VpnGetMoreSection;
