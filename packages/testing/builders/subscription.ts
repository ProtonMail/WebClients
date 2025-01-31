import { CYCLE, PLANS, type PlanIDs } from '@proton/payments';
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
