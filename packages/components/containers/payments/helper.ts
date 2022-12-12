import { c, msgid } from 'ttag';

import { CYCLE } from '@proton/shared/lib/constants';
import { Cycle } from '@proton/shared/lib/interfaces';

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
    if (cycle === CYCLE.THIRTY) {
        return c('Billing cycle').t`Payable every 30 months`;
    }
    if (cycle === CYCLE.FIFTEEN) {
        return c('Billing cycle').t`Payable every 15 months`;
    }
    return '';
};

export const getTotalBillingText = (cycle: Cycle) => {
    const n = cycle;
    return c('Checkout row').ngettext(msgid`Total for ${n} month`, `Total for ${n} months`, n);
};

export const getShortBillingText = (n: number) => {
    return c('Label').ngettext(msgid`${n} month`, `${n} months`, n);
};
