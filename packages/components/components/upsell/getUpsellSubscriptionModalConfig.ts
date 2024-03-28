import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { OpenCallbackProps, SUBSCRIPTION_STEPS } from '../..';

const getUpsellSubscriptionModalConfig = (upsellRef: string): OpenCallbackProps => ({
    planIDs: { [PLANS.MAIL]: 1 },
    cycle: CYCLE.YEARLY,
    step: SUBSCRIPTION_STEPS.CHECKOUT,
    disablePlanSelection: true,
    maximumCycle: CYCLE.YEARLY,
    upsellRef,
    metrics: {
        source: 'upsells',
    },
});

export default getUpsellSubscriptionModalConfig;
