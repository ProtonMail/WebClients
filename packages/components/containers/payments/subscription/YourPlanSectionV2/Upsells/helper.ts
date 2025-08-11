import { useMemo } from 'react';

import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import {
    type FreeSubscription,
    type PLANS,
    type Subscription,
    getPlanName,
    isFreeSubscription,
} from '@proton/payments';

import { getAllowedCycles } from '../../helpers';

export const useSubscriptionPriceComparison = (
    subscription?: Subscription | FreeSubscription,
    compareWithPlan?: PLANS
) => {
    // We forbid currencyFallback because we want to compare against the same currency
    const { plansMap, plansMapLoading } = usePreferredPlansMap(false);

    const returnFalse = {
        priceDifference: 0,
        priceDifferenceCheapestCycle: 0,
        cheapestMonthlyPrice: 0,
        priceFallbackPerMonth: 0,
        totalSavings: 0,
        showPriceDifference: false,
        showPriceDifferenceCheapest: false,
        showSavings: false,
    };

    return useMemo(() => {
        if (!subscription || isFreeSubscription(subscription) || plansMapLoading) {
            return returnFalse;
        }

        compareWithPlan = compareWithPlan ?? getPlanName(subscription);

        if (!compareWithPlan) {
            return returnFalse;
        }

        const allowedCycles = getAllowedCycles({
            plansMap,
            subscription: subscription,
            currency: subscription.Currency,
            planIDs: { [compareWithPlan]: 1 },
        });

        let pricingOptions = plansMap[compareWithPlan]?.Pricing;
        if (!pricingOptions) {
            return returnFalse;
        }
        pricingOptions = Object.fromEntries(
            Object.entries(pricingOptions).filter(([cycle]) => allowedCycles.includes(Number(cycle)))
        );

        const cycleLength = subscription.Cycle;

        // Compare against the same cycle price
        const price = pricingOptions[cycleLength];
        const normalizedPricePrice = price ? price / cycleLength : undefined;
        const normalizedSubscriptionPrice = subscription.Amount / cycleLength;
        const priceDifference =
            normalizedPricePrice !== undefined ? Math.max(0, normalizedPricePrice - normalizedSubscriptionPrice) : 0;
        const showPriceDifference = priceDifference > 0;

        // Compare against the cheapest cycle price
        let cheapestCycleLength = cycleLength; // Default to current cycle length
        const cheapestMonthlyPriceObject = Object.entries(pricingOptions)
            .map(([cycle, price]) => ({
                cycle: Number(cycle),
                monthlyPrice: price / Number(cycle),
            }))
            .reduce((best, current) => (current.monthlyPrice < best.monthlyPrice ? current : best), {
                cycle: cycleLength,
                monthlyPrice: Infinity,
            });

        const priceDifferenceCheapestCycle = Math.max(
            0,
            normalizedSubscriptionPrice - cheapestMonthlyPriceObject.monthlyPrice
        );
        const showPriceDifferenceCheapest = priceDifferenceCheapestCycle > 0;
        cheapestCycleLength = cheapestMonthlyPriceObject.cycle; // Update to actual cheapest cycle

        // Calculate total savings over full cycle
        const totalSavings = priceDifferenceCheapestCycle * cheapestCycleLength;
        const showSavings = totalSavings > 0;

        return {
            priceDifference,
            priceDifferenceCheapestCycle,
            priceFallbackPerMonth: cheapestMonthlyPriceObject.monthlyPrice,
            cheapestMonthlyPrice: cheapestMonthlyPriceObject.monthlyPrice,
            totalSavings,
            showPriceDifference,
            showPriceDifferenceCheapest,
            showSavings,
        };
    }, [subscription, plansMapLoading]);
};
