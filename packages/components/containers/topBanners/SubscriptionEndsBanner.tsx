import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Time from '@proton/components/components/time/Time';
import { REACTIVATE_SOURCE } from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationTelemetry';
import useConfig from '@proton/components/hooks/useConfig';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
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

    const reactivateLink = (
        <SettingsLink
            data-testid="reactivate-link"
            key="reactivate-subscription"
            className="color-inherit"
            path={`/dashboard?source=${REACTIVATE_SOURCE.banners}#your-subscriptions`}
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
