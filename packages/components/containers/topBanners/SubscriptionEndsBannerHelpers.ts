import { fromUnixTime, isFuture, subDays } from 'date-fns';

import { type ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import type { SubscriptionPlan } from '@proton/payments/core/plan/interface';
import { type MaybeFreeSubscription, isTrial } from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import useShowDashboard, { useShowDriveDashboard } from '../../hooks/accounts/useShowDashboard';
import useConfig from '../../hooks/useConfig';
import useShowVPNDashboard from '../../hooks/useShowVPNDashboard';

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
    subscription: MaybeFreeSubscription,
    subscriptionExpiresSoon: boolean,
    expirationDate: number | null
): boolean {
    const { APP_NAME } = useConfig();
    const { showVPNDashboard } = useShowVPNDashboard(app);
    const { showDashboard } = useShowDashboard(app);
    const { showDashboard: showDriveDashboard } = useShowDriveDashboard(app);

    if (!([APPS.PROTONACCOUNT, APPS.PROTONVPN_SETTINGS] as APP_NAMES[]).includes(APP_NAME)) {
        return true;
    }

    if (showVPNDashboard || showDashboard || showDriveDashboard) {
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
