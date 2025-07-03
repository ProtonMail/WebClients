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
    isStringPLAN,
} from '@proton/payments';
import { addMonths } from '@proton/shared/lib/date-fns-utc';
import type { EitherOr } from '@proton/shared/lib/interfaces';

import { getTestPlans } from '../data';

const innerBuildSubscription = (value?: Partial<Subscription>): Subscription => {
    const Cycle = value?.Cycle ?? CYCLE.YEARLY;
    const Currency = value?.Currency ?? 'EUR';

    return {
        Cycle,
        Currency,
        Plans: [],
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
        IsTrial: false,
        ...value,
    };
};

type FullPlanConfig = EitherOr<
    {
        planIDs: PlanIDs;
        planName: PLANS;
        currency: Currency;
        cycle: CYCLE;
    },
    'planIDs' | 'planName'
>;

function isFullPlanConfig(plan: SelectedPlanParam): plan is FullPlanConfig {
    return (
        typeof plan === 'object' && ('planIDs' in plan || 'planName' in plan) && 'currency' in plan && 'cycle' in plan
    );
}

type SelectedPlanParam = SelectedPlan | FullPlanConfig | PLANS | PlanIDs;

const getSelectedPlan = (plan: SelectedPlanParam): SelectedPlan => {
    if (plan instanceof SelectedPlan) {
        return plan;
    }

    const defaultCurrency: Currency = 'EUR';
    const defaultCycle: CYCLE = CYCLE.YEARLY;

    if (typeof plan === 'string' && isStringPLAN(plan)) {
        return new SelectedPlan({ [plan]: 1 }, getTestPlans(defaultCurrency), defaultCycle, defaultCurrency);
    }

    if (isFullPlanConfig(plan)) {
        const planIDs: PlanIDs = plan.planIDs ?? { [plan.planName]: 1 };

        return new SelectedPlan(planIDs, getTestPlans(plan.currency), plan.cycle, plan.currency);
    }

    return new SelectedPlan(plan, getTestPlans(defaultCurrency), defaultCycle, defaultCurrency);
};

export const buildSubscription = (plan: SelectedPlanParam = PLANS.BUNDLE, override?: Partial<Subscription>) => {
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

    return innerBuildSubscription({
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
