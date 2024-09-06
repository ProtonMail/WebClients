import { useMemo } from 'react';

import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getPlanIDs, isTrial } from '@proton/shared/lib/helpers/subscription';
import type { PlansMap, SubscriptionCheckResponse, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { SubscriptionMode } from '@proton/shared/lib/interfaces';

import type { Model } from './SubscriptionContainer';

export interface CheckoutModifiers {
    isProration: boolean;
    isScheduledSubscription: boolean;
    isCustomBilling: boolean;
    isAddonDowngrade: boolean;
}

export const useCheckoutModifiers = (
    model: Model,
    subscription: SubscriptionModel,
    plansMap: PlansMap,
    checkResult: SubscriptionCheckResponse
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

        // That's a catch-all scenario. Essentially, if user doesn't really have Proration, nor custom billings,
        // nor scheduled subscription, then we still claim that it's Proration. From the rendering perspective,
        // it's a convernient assumption, because then we pretend that it's Proration case with Proration === 0.
        // Essentially it means that we will render no additional UI specific to any of the three cases.
        //
        // Absence of checkResult means that it's not loaded yet.
        // If user doesn't buy the same plan, then custom billing and scheduled subscription are not applicable.
        // If Prorartion is undefined, then that's not a full checkResult.
        // If user has trial, then we just need to show the Proration UI with Proration === 0.
        if (!checkResult || !userBuysTheSamePlan || checkResult.Proration === undefined || isTrial(subscription)) {
            return true;
        }

        // The main indicator for the proration is non-zero Proration value.
        // However we must also ensure that it's not custom billings by checking that UnusedCredit is 0 or undefined.
        return (
            checkResult.Proration !== 0 && (checkResult.UnusedCredit === 0 || checkResult.UnusedCredit === undefined)
        );
    }, [subscription, model, checkResult]);

    if (checkResult?.SubscriptionMode !== undefined) {
        return {
            isProration: checkResult.SubscriptionMode === SubscriptionMode.Regular,
            isScheduledSubscription: checkResult.SubscriptionMode === SubscriptionMode.Upcoming,
            isCustomBilling: checkResult.SubscriptionMode === SubscriptionMode.CustomBillings,
            isAddonDowngrade: checkResult.SubscriptionMode === SubscriptionMode.AddonDowngrade,
        };
    }

    if (checkResult?.optimistic) {
        return {
            isProration: false,
            isScheduledSubscription: false,
            isCustomBilling: false,
            isAddonDowngrade: false,
        };
    }

    const isCustomBilling =
        checkResult && checkResult.UnusedCredit !== undefined ? checkResult.UnusedCredit !== 0 : false;

    const isScheduledSubscription = !isProration && !isCustomBilling;

    // fallback. It will be removed after CB migration is done.
    return {
        isProration,
        isScheduledSubscription,
        isCustomBilling,
        isAddonDowngrade: false,
    };
};
