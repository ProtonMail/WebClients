import { getPlanByName } from '@proton/payments';

import type { PlanProps } from './UpsellModal';
import { getPlanFeatures } from './helpers/getPlanFeatures';
import { getUpsellAmountAndSavings } from './helpers/getUpsellAmountAndSavings';

export const useUpsellModal = ({ freePlan, plans, subscription, upsellPlanId }: PlanProps) => {
    const currency = subscription.Currency;
    const { Amount: currentPlanAmount, Cycle: currentPlanCycle, Title: downgradedPlanName } = subscription.Plans[0];
    const downgradedPlanAmount = currentPlanAmount / currentPlanCycle;
    const upsellPlan = getPlanByName(plans, upsellPlanId, currency, undefined, false);

    // upsellPlan will never be undefined, because we wouldn't get to this file if it were,
    // but TS doesn't know that, so guard against undefined.
    const upsellPlanFeatures = upsellPlan ? getPlanFeatures(upsellPlan) : [];
    const upsellPlanName = upsellPlan?.Title ?? '';
    const [upsellPlanAmount, upsellSavings] = upsellPlan
        ? getUpsellAmountAndSavings({ currency, plans, subscription, upsellPlan })
        : [0, '0%'];
    const freePlanFeatures = getPlanFeatures(freePlan);

    return {
        currency,
        downgradedPlanAmount,
        downgradedPlanName,
        freePlanFeatures,
        freePlanTitle: freePlan.Title,
        upsellPlanAmount,
        upsellPlanFeatures,
        upsellPlanName,
        upsellSavings,
    };
};
