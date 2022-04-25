import { Cycle } from '@proton/shared/lib/interfaces';
import { CYCLE } from '@proton/shared/lib/constants';
import { c, msgid } from 'ttag';

export const getDueCycleText = (cycle: Cycle) => {
    if (cycle === CYCLE.MONTHLY) {
        return c('Billing cycle').t`Payable every month`;
    }
    if (cycle === CYCLE.YEARLY) {
        return c('Billing cycle').t`Payable every 12 months`;
    }
    if (cycle === CYCLE.TWO_YEARS) {
        return c('Billing cycle').t`Payable every 24 months`;
    }
    return '';
};

export const getTotalBillingText = (cycle: Cycle) => {
    const n = cycle;
    return c('Checkout row').ngettext(msgid`Total for ${n} month`, `Total for ${n} months`, n);
};
