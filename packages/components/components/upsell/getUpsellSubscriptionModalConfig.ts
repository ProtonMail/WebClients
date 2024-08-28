import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

const getUpsellSubscriptionModalConfig = (
    options: Pick<OpenCallbackProps, 'planIDs' | 'step' | 'cycle' | 'coupon' | 'upsellRef'>
): OpenCallbackProps => ({
    coupon: options.coupon,
    cycle: options.cycle || CYCLE.YEARLY,
    disablePlanSelection: options.step === SUBSCRIPTION_STEPS.CHECKOUT,
    maximumCycle: CYCLE.YEARLY,
    metrics: {
        source: 'upsells',
    },
    mode: 'upsell-modal', // hide the Free plan
    planIDs: options.planIDs || { [PLANS.MAIL]: 1 },
    step: options.step || SUBSCRIPTION_STEPS.CHECKOUT,
    upsellRef: options.upsellRef,
});

export default getUpsellSubscriptionModalConfig;
