import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { OpenCallbackProps, SUBSCRIPTION_STEPS } from '../..';

const getUpsellSubscriptionModalConfig = (): OpenCallbackProps => ({
    planIDs: { [PLANS.MAIL]: 1 },
    cycle: CYCLE.YEARLY,
    step: SUBSCRIPTION_STEPS.CHECKOUT,
    disablePlanSelection: true,
    disableCycleSelector: true,
    metrics: {
        source: 'upsells',
    },
});

export default getUpsellSubscriptionModalConfig;
