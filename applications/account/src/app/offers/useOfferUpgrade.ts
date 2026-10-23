import { useCallback } from 'react';

import { useSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import type { CtaUpgradeParams } from '@proton/offers-delivery/interface';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

export const useOfferUpgrade = () => {
    const openSubscriptionModal = useSubscriptionModalRaw();
    return useCallback(
        (cta: CtaUpgradeParams | null) =>
            openSubscriptionModal({
                step: cta?.plan ? SUBSCRIPTION_STEPS.CHECKOUT : SUBSCRIPTION_STEPS.PLAN_SELECTION,
                coupon: cta?.coupon,
                cycle: cta?.cycle,
                plan: cta?.plan,
                disableCycleSelector: cta?.disableCycleSelector,
                disablePlanSelection: cta?.disablePlanSelector,
            }),
        [openSubscriptionModal]
    );
};
