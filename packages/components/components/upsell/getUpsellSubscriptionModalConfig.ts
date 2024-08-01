import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import type { OpenCallbackProps } from '../..';
import { SUBSCRIPTION_STEPS } from '../..';

const getUpsellSubscriptionModalConfig = (
    options: Pick<OpenCallbackProps, 'step' | 'cycle' | 'coupon' | 'upsellRef'>
): OpenCallbackProps => ({
    coupon: options.coupon,
    cycle: options.cycle || CYCLE.YEARLY,
    disablePlanSelection: options.step === SUBSCRIPTION_STEPS.CHECKOUT,
    maximumCycle: CYCLE.YEARLY,
    metrics: {
        source: 'upsells',
    },
    mode: 'upsell-modal', // hide the Free plan
    planIDs: { [PLANS.MAIL]: 1 },
    step: options.step || SUBSCRIPTION_STEPS.CHECKOUT,
    upsellRef: options.upsellRef,
});

export default getUpsellSubscriptionModalConfig;
