import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Href } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Time from '@proton/components/components/time/Time';
import { REACTIVATE_SOURCE } from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationTelemetry';
import { getReactivateSubscriptionAction } from '@proton/components/containers/payments/subscription/helpers/subscriptionExpires';
import useConfig from '@proton/components/hooks/useConfig';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
import { SubscriptionPlatform } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import { subscriptionExpires } from '../payments/subscription/helpers';
import TopBanner from './TopBanner';

const SubscriptionEndsBanner = ({ app }: { app: APP_NAMES }) => {
    const { APP_NAME } = useConfig();
    const [subscription] = useSubscription();
    const { subscriptionExpiresSoon, planName, expirationDate } = subscriptionExpires(subscription!);
    const { showVPNDashboard } = useShowVPNDashboard(app);

    if (!([APPS.PROTONACCOUNT, APPS.PROTONVPN_SETTINGS] as APP_NAMES[]).includes(APP_NAME)) {
        return null;
    }

    if (showVPNDashboard) {
        return null;
    }

    if (!subscriptionExpiresSoon || !subscription) {
        return null;
    }

    const byDate = (
        <Time format="PPP" key="subscription-end">
            {expirationDate}
        </Time>
    );

    const reactivateLinkData = getReactivateSubscriptionAction(subscription, REACTIVATE_SOURCE.banners);

    if (reactivateLinkData.type === 'external') {
        if (reactivateLinkData.platform === SubscriptionPlatform.Android) {
            const reactivateLink = (
                <Href
                    key="reactivate-subscription"
                    className="color-inherit"
                    href={reactivateLinkData.href}
                    target="_blank"
                >
                    {
                        // translator: Subscription ending: To keep your {Plan Name} benefits, restart your subscription in the Google Play Store by {Mmm DD, YYYY}. [Resume now](https://play.google.com/store/account/subscriptions)
                        c('Link').t`Resume now`
                    }
                </Href>
            );
            return (
                <TopBanner className="bg-danger">
                    {
                        // translator: Subscription ending: To keep your {Plan Name} benefits, restart your subscription in the Google Play Store by {Mmm DD, YYYY}. [Resume now](https://play.google.com/store/account/subscriptions)
                        c('Info')
                            .jt`Subscription ending: To keep your ${planName} benefits, restart your subscription in the Google Play Store by ${byDate}. ${reactivateLink}`
                    }
                </TopBanner>
            );
        }

        if (reactivateLinkData.platform === SubscriptionPlatform.iOS) {
            const reactivateLink = (
                <Href
                    key="reactivate-subscription"
                    className="color-inherit"
                    href={reactivateLinkData.href}
                    target="_blank"
                >
                    {
                        // translator: Subscription ending: To keep your {Plan Name} benefits, restart your subscription in the Apple App Store by {Mmm DD, YYYY}. [Resume now](https://apps.apple.com/account/subscriptions)
                        c('Link').t`Resume now`
                    }
                </Href>
            );
            return (
                <TopBanner className="bg-danger">
                    {
                        // translator: Subscription ending: To keep your {Plan Name} benefits, restart your subscription in the Apple App Store by {Mmm DD, YYYY}. [Resume now](https://apps.apple.com/account/subscriptions)
                        c('Info')
                            .jt`Subscription ending: To keep your ${planName} benefits, restart your subscription in the Apple App Store by ${byDate}. ${reactivateLink}`
                    }
                </TopBanner>
            );
        }

        return null;
    }

    const reactivateLink = (
        <SettingsLink
            data-testid="reactivate-link"
            key="reactivate-subscription"
            className="color-inherit"
            path={reactivateLinkData.path}
        >{c('Link').t`Reactivate now`}</SettingsLink>
    );

    return (
        <TopBanner className="bg-danger">
            {c('Info')
                .jt`Subscription ending: Reactivate by ${byDate} to keep your ${planName} benefits. ${reactivateLink}`}
        </TopBanner>
    );
};

export default SubscriptionEndsBanner;
