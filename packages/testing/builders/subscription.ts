import { CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, Renew, SubscriptionModel } from '@proton/shared/lib/interfaces';

export const buildSubscription = (value?: Partial<SubscriptionModel>): SubscriptionModel => {
    return {
        ID: 'subscriptionId123',
        InvoiceID: 'invoiceId123',
        Cycle: CYCLE.YEARLY,
        PeriodStart: 1685966060,
        PeriodEnd: 1717588460,
        CreateTime: 1685966060,
        CouponCode: null,
        Currency: 'EUR',
        Amount: 11988,
        Discount: 0,
        RenewAmount: 11988,
        RenewDiscount: 0,
        Renew: Renew.Enabled,
        External: External.Default,
        Plans: [
            {
                ID: 'planId123',
                Name: PLANS.BUNDLE,
                Type: PLAN_TYPES.PLAN,
                Title: 'Proton Unlimited',
                MaxDomains: 3,
                MaxAddresses: 15,
                MaxCalendars: 25,
                MaxSpace: 536870912000,
                MaxMembers: 1,
                MaxVPN: 10,
                MaxTier: 2,
                Services: 15,
                Features: 1,
                State: 1,
                Cycle: 12,
                Currency: 'EUR',
                Amount: 11988,
                Quantity: 1,
                Offer: 'default',
            },
        ],
        isManagedByMozilla: false,
        ...value,
    };
};
