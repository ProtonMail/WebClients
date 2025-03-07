import { c, msgid } from 'ttag';

import type { CYCLE } from '@proton/payments';
import { PLANS } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export function getPlanTitlePlusMaybeBrand(planTitle?: string, planName?: PLANS) {
    return planName === PLANS.FREE ? `${BRAND_NAME} ${planTitle}` : planTitle;
}

export const getDashboardUpsellTitle = (months: CYCLE) => {
    return c('Plans').ngettext(msgid`${months} month plan`, `${months} month plan`, months);
};

export const getBillingCycleText = (cycle: CYCLE) => {
    if (!cycle) {
        return '';
    }
    return c('Plans').ngettext(msgid`${cycle} month`, `${cycle} months`, cycle);
};
