import { useCallback, useMemo } from 'react';

import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components/index';
import type { FreeSubscription, Subscription } from '@proton/payments';
import { PLANS, hasSomeAddonOrPlan } from '@proton/payments';

// subscription with family, duo and unlimited are the TA for visionary plan
const VISIONARY_TA_PLAN_LIST = [PLANS.DUO, PLANS.FAMILY, PLANS.BUNDLE];

export const useUpsellModal = (subscription: Subscription | FreeSubscription | undefined) => {
    const [openSubscriptionModal] = useSubscriptionModal();

    const open = useCallback(() => {
        const isVisionaryTA = hasSomeAddonOrPlan(subscription, VISIONARY_TA_PLAN_LIST);
        // if the subscription is in the TA list, they can only upgrade to visionary plan
        const subscriptionProps = isVisionaryTA
            ? {
                  step: SUBSCRIPTION_STEPS.CHECKOUT,
                  disablePlanSelection: true,
                  plan: PLANS.VISIONARY,
              }
            : {
                  step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
              };
        openSubscriptionModal({
            ...subscriptionProps,
            metrics: {
                source: 'upsells',
            },
        });
    }, [openSubscriptionModal]);

    return useMemo(() => [open], [open]);
};
