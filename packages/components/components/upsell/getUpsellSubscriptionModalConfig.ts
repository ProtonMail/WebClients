import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { CYCLE } from '@proton/payments';
import type { ADDON_NAMES, PLANS } from '@proton/payments';

interface Props
    extends Pick<OpenCallbackProps, 'step' | 'cycle' | 'coupon' | 'upsellRef' | 'maximumCycle' | 'minimumCycle'> {
    plan?: PLANS | ADDON_NAMES;
}

const getUpsellSubscriptionModalConfig = (options: Props): OpenCallbackProps => {
    const baseConfig: OpenCallbackProps = {
        coupon: options.coupon,
        cycle: options.cycle || CYCLE.YEARLY,
        disablePlanSelection: options.step === SUBSCRIPTION_STEPS.CHECKOUT,
        maximumCycle: options.maximumCycle || CYCLE.YEARLY,
        minimumCycle: options.minimumCycle,
        metrics: {
            source: 'upsells',
        },
        mode: 'upsell-modal', // hide the Free plan
        step: options.step || SUBSCRIPTION_STEPS.CHECKOUT,
        upsellRef: options.upsellRef,
    };

    if (options.plan) {
        return {
            ...baseConfig,
            planIDs: { [options.plan]: 1 },
        };
    }

    return baseConfig;
};

export default getUpsellSubscriptionModalConfig;
