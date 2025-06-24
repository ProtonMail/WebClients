import {
    CYCLE,
    type Currency,
    PLANS,
    type Plan,
    type PlanIDs,
    Renew,
    SelectedPlan,
    type Subscription,
    SubscriptionPlatform,
} from '@proton/payments';
import { addMonths } from '@proton/shared/lib/date-fns-utc';
import type { EitherOr } from '@proton/shared/lib/interfaces';

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
        External: SubscriptionPlatform.Default,
        ...value,
    };
};

type SelectedPlanParam =
    | SelectedPlan
    | EitherOr<
          {
              planIDs: PlanIDs;
              planName: PLANS;
              currency: Currency;
              cycle: CYCLE;
          },
          'planIDs' | 'planName'
      >;

const getSelectedPlan = (plan: SelectedPlanParam): SelectedPlan => {
    if (plan instanceof SelectedPlan) {
        return plan;
    }

    const planIDs: PlanIDs = plan.planIDs ?? { [plan.planName]: 1 };

    return new SelectedPlan(planIDs, getTestPlans(plan.currency), plan.cycle, plan.currency);
};

export const smartBuildSubscription = (plan: SelectedPlanParam, override?: Partial<Subscription>) => {
    const selectedPlan = getSelectedPlan(plan);

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
