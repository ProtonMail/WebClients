import { c, msgid } from 'ttag';

import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { Cycle, PlanIDs, Subscription } from '@proton/shared/lib/interfaces';

export const getTotalBillingText = (cycle: Cycle) => {
    const n = cycle;
    return c('Checkout row').ngettext(msgid`Total for ${n} month`, `Total for ${n} months`, n);
};

export const getShortBillingText = (n: number) => {
    return c('Label').ngettext(msgid`${n} month`, `${n} months`, n);
};

export function isSubscriptionUnchanged(subscription: Subscription | null | undefined, planIds: PlanIDs): boolean {
    const subscriptionPlanIds = getPlanIDs(subscription);
    return isDeepEqual(subscriptionPlanIds, planIds);
}
