import { cloneDeep } from 'lodash';

import { CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, Renew, Subscription, SubscriptionModel } from '@proton/shared/lib/interfaces';

export const subscriptionMock: SubscriptionModel = {
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
            MaxAI: 0,
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
};

export function getSubscriptionMock() {
    return cloneDeep(subscriptionMock);
}

export const upcomingSubscriptionMock: Subscription = {
    ID: 'subscriptionId124',
    InvoiceID: 'invoiceId124',
    Cycle: CYCLE.TWO_YEARS,
    PeriodStart: 1717588460,
    PeriodEnd: 1780660460,
    CreateTime: 1685966060,
    CouponCode: null,
    Currency: 'EUR',
    Amount: 19176,
    Discount: 0,
    RenewAmount: 19176,
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
            MaxAI: 0,
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
};
