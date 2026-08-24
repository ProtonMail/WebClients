import { type ADDON_NAMES, CYCLE, type PLANS } from '@proton/payments/core/constants';

import type { OpenCallbackProps } from '../../containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../containers/payments/subscription/constants';

interface Props extends Pick<
    OpenCallbackProps,
    'step' | 'cycle' | 'coupon' | 'upsellRef' | 'maximumCycle' | 'minimumCycle'
> {
    plan?: PLANS | ADDON_NAMES;
}

const getUpsellSubscriptionModalConfig = (options: Props): OpenCallbackProps => {
    const config: OpenCallbackProps = {
        coupon: options.coupon,
        cycle: options.cycle || CYCLE.YEARLY,
        disablePlanSelection: options.step === SUBSCRIPTION_STEPS.CHECKOUT,
        maximumCycle: options.maximumCycle || CYCLE.YEARLY,
        minimumCycle: options.minimumCycle,
        mode: 'upsell-modal', // hide the Free plan
        step: options.step || SUBSCRIPTION_STEPS.CHECKOUT,
        upsellRef: options.upsellRef,
    };

    if (options.plan) {
        config.planIDs = { [options.plan]: 1 };
    }

    return config;
};

export default getUpsellSubscriptionModalConfig;
