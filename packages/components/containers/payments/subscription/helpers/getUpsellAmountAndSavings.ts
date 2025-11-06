import {
    type CYCLE,
    type Currency,
    type Cycle,
    type Plan,
    type Subscription,
    getPlan,
    getPlansMap,
} from '@proton/payments';

import { getAllowedCycles } from '../helpers/getAllowedCycles';

interface GetSavingsProps {
    currentAmount: number;
    currentCycle: Cycle;
    upsellMonthlyAmount: number;
}

interface UpsellAmountAndSavingsProps {
    currency: Currency;
    plans: Plan[];
    subscription: Subscription;
    upsellPlan: Plan;
}

const getSavings = ({ currentAmount, currentCycle, upsellMonthlyAmount }: GetSavingsProps) => {
    const currentMonthlyAmount = currentAmount / currentCycle;
    const amountSaved = currentMonthlyAmount - upsellMonthlyAmount;

    return Math.round((amountSaved / currentMonthlyAmount) * 100);
};

// If the current cycle isn't in the allowed cycles, return the cheapest allowed cycle.
const getUpsellCycle = (currentCycle: Cycle, allowedCycles: CYCLE[]): Cycle => {
    if (allowedCycles.includes(currentCycle)) {
        return currentCycle;
    }
    return Math.max(...allowedCycles);
};

export const getUpsellAmountAndSavings = ({
    currency,
    plans,
    subscription,
    upsellPlan,
}: UpsellAmountAndSavingsProps): [number, string] => {
    const plansMap = getPlansMap(plans, currency, false);
    const allowedCycles = getAllowedCycles({ subscription, planIDs: { [upsellPlan.Name]: 1 }, currency, plansMap });
    const currentPlan = getPlan(subscription);

    if (!currentPlan) {
        return [0, '0%'];
    }

    const upsellCycle = getUpsellCycle(currentPlan.Cycle, allowedCycles);
    const { Pricing: upsellPricing } = upsellPlan;
    const upsellAmountPerCycle = upsellPricing[upsellCycle] ?? 0;
    const upsellMonthlyAmount = upsellAmountPerCycle / upsellCycle;
    const upsellSavings = getSavings({
        currentAmount: currentPlan.Amount,
        currentCycle: currentPlan.Cycle,
        upsellMonthlyAmount,
    });

    return [upsellMonthlyAmount, `${upsellSavings}%`];
};
