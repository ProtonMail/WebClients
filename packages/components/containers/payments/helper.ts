import { c, msgid } from 'ttag';

import { CYCLE } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { Currency, Cycle, PlanIDs, SubscriptionModel } from '@proton/shared/lib/interfaces';

export const getTotalBillingText = (cycle: Cycle) => {
    const n = cycle;
    return c('Checkout row').ngettext(msgid`Total for ${n} month`, `Total for ${n} months`, n);
};

export const getShortBillingText = (n: number) => {
    return c('Label').ngettext(msgid`${n} month`, `${n} months`, n);
};

export function isSubscriptionUnchanged(
    subscription: SubscriptionModel | null | undefined,
    planIds: PlanIDs,
    plansCurrency: Currency,
    cycle?: CYCLE
): boolean {
    const subscriptionPlanIds = getPlanIDs(subscription);

    const planIdsUnchanged = isDeepEqual(subscriptionPlanIds, planIds);
    const currencyUnchanged = !!subscription ? subscription?.Currency === plansCurrency : true;
    // Cycle is optional, so if it is not provided, we assume it is unchanged
    const cycleUnchanged =
        !cycle || cycle === subscription?.Cycle || cycle === subscription?.UpcomingSubscription?.Cycle;

    return planIdsUnchanged && cycleUnchanged && currencyUnchanged;
}
