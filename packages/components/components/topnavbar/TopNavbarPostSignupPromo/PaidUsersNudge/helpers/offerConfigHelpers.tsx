import { c } from 'ttag';

import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { SupportedPlans } from './interface';

export const defaultOfferUpsellConfig = {
    step: SUBSCRIPTION_STEPS.CHECKOUT,
    coupon: COUPON_CODES.ANNUALOFFER25,
    cycle: CYCLE.YEARLY,
    maximumCycle: CYCLE.YEARLY,
    minimumCycle: CYCLE.YEARLY,
};

// We need this method so the translation is evaluated and sent to Crowdin
export const getPlanCopy = (plan: SupportedPlans) => {
    if (plan === PLANS.MAIL) {
        const planName = PLAN_NAMES[PLANS.MAIL];
        return c('Offer').t`${planName} for 12 months`;
    } else if (plan === PLANS.DRIVE) {
        const planName = PLAN_NAMES[PLANS.DRIVE];
        return c('Offer').t`${planName} for 12 months`;
    } else if (plan === PLANS.BUNDLE) {
        return c('Offer').t`${BRAND_NAME} Unlimited for 12 months`;
    }

    return '';
};
