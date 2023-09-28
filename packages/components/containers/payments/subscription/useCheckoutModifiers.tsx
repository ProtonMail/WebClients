import { useMemo } from 'react';

import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { PlansMap, SubscriptionCheckResponse, SubscriptionModel } from '@proton/shared/lib/interfaces';

import { Model } from './SubscriptionModal';

export interface CheckoutModifiers {
    isProration: boolean;
    isScheduledSubscription: boolean;
    isCustomBilling: boolean;
}

export const useCheckoutModifiers = (
    model: Model,
    subscription: SubscriptionModel,
    plansMap: PlansMap,
    checkResult?: SubscriptionCheckResponse
) => {
    const isProration = useMemo(() => {
        const checkout = getCheckout({
            planIDs: getPlanIDs(subscription),
            plansMap,
            checkResult,
        });
        const activePlan = checkout.planName as string;

        const selectedPlans = Object.keys(model.planIDs);

        const userBuysTheSamePlan = selectedPlans.includes(activePlan);

        if (!checkResult || !userBuysTheSamePlan || checkResult.Proration === undefined) {
            return true;
        }

        return (
            checkResult.Proration !== 0 && (checkResult.UnusedCredit === 0 || checkResult.UnusedCredit === undefined)
        );
    }, [subscription, model, checkResult]);

    const isCustomBilling = checkResult ? checkResult.UnusedCredit !== 0 : false;

    const isScheduledSubscription = !isProration && !isCustomBilling;

    return {
        isProration,
        isScheduledSubscription,
        isCustomBilling,
    };
};
