import { ReactElement } from 'react';

import { c } from 'ttag';

import { CYCLE } from '@proton/shared/lib/constants';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

export const getDealBilledDescription = (cycle: CYCLE, amount: ReactElement): string | string[] | null => {
    switch (cycle) {
        case MONTHLY:
            return c('specialoffer: Offers').jt`Billed at ${amount} for the first month.`;
        case YEARLY:
            return c('specialoffer: Offers').jt`Billed at ${amount} for the first year.`;
        case TWO_YEARS:
            return c('specialoffer: Offers').jt`Billed at ${amount} for the first 2 years.`;
        default:
            return null;
    }
};

export const getDealDuration = (cycle: CYCLE): string | null => {
    switch (cycle) {
        case MONTHLY:
            return c('specialoffer: Offers').t`for 1 month`;
        case YEARLY:
            return c('specialoffer: Offers').t`for 12 months`;
        case TWO_YEARS:
            return c('specialoffer: Offers').t`for 24 months`;
        default:
            return null;
    }
};
