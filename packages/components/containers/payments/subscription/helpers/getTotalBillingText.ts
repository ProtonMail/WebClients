import { c, msgid } from 'ttag';

import { type Cycle, type PlanIDs, isLifetimePlanSelected } from '@proton/payments';

export const getTotalBillingText = (cycle: Cycle, planIDs: PlanIDs, { excludingTax }: { excludingTax: boolean }) => {
    if (isLifetimePlanSelected(planIDs)) {
        if (excludingTax) {
            return c('Checkout row').t`Subtotal`;
        }

        return c('Checkout row').t`Total`;
    }

    if (excludingTax) {
        return c('Checkout row').ngettext(msgid`Subtotal for ${cycle} month`, `Subtotal for ${cycle} months`, cycle);
    }

    const n = cycle;
    return c('Checkout row').ngettext(msgid`Total for ${n} month`, `Total for ${n} months`, n);
};

export const getShortBillingText = (n: number, planIDs: PlanIDs) => {
    if (isLifetimePlanSelected(planIDs)) {
        return c('Subscription length').t`Lifetime`;
    }

    return c('Label').ngettext(msgid`${n} month`, `${n} months`, n);
};
