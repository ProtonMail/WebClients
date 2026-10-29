import { fromUnixTime, isFuture, subDays } from 'date-fns';

import { useConfig } from '@proton/app-context/useConfig';
import { type ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import { getSoonestEndingSubscription, isTrial, subscriptionExpires } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { SubscriptionPlan } from '@proton/shared/lib/payments/plan/interface';

import useShowDashboard, { useShowDriveDashboard } from '../../hooks/accounts/useShowDashboard';
import useShowVPNDashboard from '../../hooks/useShowVPNDashboard';

const targetedPlans: (PLANS | ADDON_NAMES)[] = [PLANS.MAIL_PRO, PLANS.MAIL_BUSINESS];

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

function canShowBannerForSubscription(subscription: Subscription): boolean {
    if (isTrial(subscription)) {
        return false;
    }

    const { subscriptionExpiresSoon, expirationDate } = subscriptionExpires(subscription);

    if (!subscriptionExpiresSoon || !expirationDate) {
        return false;
    }

    return !shouldHideBannerForDistantExpiration(subscription.Plans, expirationDate);
}

export function useSubscriptionWithEndsBanner(app: APP_NAMES, subscriptions: Subscription[]): Subscription | undefined {
    const { APP_NAME } = useConfig();
    const { showVPNDashboard } = useShowVPNDashboard(app);
    const { showDashboard } = useShowDashboard(app);
    const { showDashboard: showDriveDashboard } = useShowDriveDashboard(app);

    if (!([APPS.PROTONACCOUNT, APPS.PROTONVPN_SETTINGS] as APP_NAMES[]).includes(APP_NAME)) {
        return undefined;
    }

    if (showVPNDashboard || showDashboard || showDriveDashboard) {
        return undefined;
    }

    return getSoonestEndingSubscription(subscriptions, canShowBannerForSubscription);
}
