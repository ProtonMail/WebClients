import { CYCLE, PLANS, type PlanIDs, type SelectedPlan } from '@proton/payments';
import { addMonths } from '@proton/shared/lib/date-fns-utc';
import { External, type Plan, Renew, type Subscription } from '@proton/shared/lib/interfaces';

import { getTestPlans } from '../data';

export const buildSubscription = (
    value?: Partial<Subscription>,
    planIDs: PlanIDs = {
        [PLANS.BUNDLE]: 1,
    }
): Subscription => {
    const Cycle = value?.Cycle ?? CYCLE.YEARLY;
    const Currency = value?.Currency ?? 'EUR';

    const Plans = Object.entries(planIDs).map(([planName, quantity]) => ({
        ...(getTestPlans(Currency).find((plan) => plan.Name === planName) as Plan),
        Quantity: quantity,
    }));

    return {
        Cycle,
        Currency,
        Plans,
        ID: 'subscriptionId123',
        InvoiceID: 'invoiceId123',
        PeriodStart: 1685966060,
        PeriodEnd: 1717588460,
        CreateTime: 1685966060,
        CouponCode: null,
        Amount: 11988,
        Discount: 0,
        RenewAmount: 11988,
        RenewDiscount: 0,
        Renew: Renew.Enabled,
        External: External.Default,
        ...value,
    };
};

export const smartBuildSubscription = (selectedPlan: SelectedPlan, override?: Partial<Subscription>) => {
    const plans = getTestPlans(selectedPlan.currency);

    const plansAndQuantities = Object.entries(selectedPlan.planIDs).map(([planName, quantity]) => ({
        plan: plans.find((plan) => plan.Name === planName) as Plan,
        quantity,
    }));

    const totalPrice = plansAndQuantities.reduce((acc, { plan, quantity }) => {
        if (!plan) {
            return acc;
        }

        return acc + (plan.Pricing[selectedPlan.cycle] ?? 0) * quantity;
    }, 0);

    const PeriodStart = Date.now() / 1000;
    const PeriodEnd = addMonths(new Date(), selectedPlan.cycle).getTime() / 1000;
    const CreateTime = PeriodStart;

    return buildSubscription({
        Amount: totalPrice,
        RenewAmount: totalPrice,
        Currency: selectedPlan.currency,
        Cycle: selectedPlan.cycle,
        Plans: plansAndQuantities.map(({ plan, quantity }) => ({
            ...plan,
            Quantity: quantity,
        })),
        PeriodStart,
        PeriodEnd,
        CreateTime,
        ...override,
    });
};
