import { fromUnixTime, isFuture, subDays } from 'date-fns';

import useShowDashboard, { getDashboardFeatureFlag } from '@proton/components/hooks/accounts/useShowDashboard';
import useConfig from '@proton/components/hooks/useConfig';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
import type { ADDON_NAMES, Subscription, SubscriptionPlan } from '@proton/payments';
import { PLANS, isTrial } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

export const targetedPlans: (PLANS | ADDON_NAMES)[] = [PLANS.MAIL_PRO, PLANS.MAIL_BUSINESS];

function shouldHideBannerForDistantExpiration(
    subscriptionPlans: SubscriptionPlan[] | undefined,
    expirationDate: number
): boolean {
    const hasTargetedPlans = subscriptionPlans?.some((p) => targetedPlans.includes(p.Name));

    if (!hasTargetedPlans) {
        return false;
    }

    const threshold = subDays(fromUnixTime(expirationDate), 30);

    return isFuture(threshold);
}

export function useHideBanner(
    app: APP_NAMES,
    subscription: Subscription | undefined,
    subscriptionExpiresSoon: boolean,
    expirationDate: number | null
): boolean {
    const { APP_NAME } = useConfig();
    const { showVPNDashboard } = useShowVPNDashboard(app);
    const { showDashboard } = useShowDashboard(app, getDashboardFeatureFlag(app));

    if (!([APPS.PROTONACCOUNT, APPS.PROTONVPN_SETTINGS] as APP_NAMES[]).includes(APP_NAME)) {
        return true;
    }

    if (showVPNDashboard || showDashboard) {
        return true;
    }

    if (isTrial(subscription)) {
        return true;
    }

    if (!subscriptionExpiresSoon || !expirationDate) {
        return true;
    }

    if (shouldHideBannerForDistantExpiration(subscription?.Plans, expirationDate)) {
        return true;
    }

    return false;
}
