import { type Currency, DEFAULT_CURRENCY, PLANS, PLAN_SERVICES, PLAN_TYPES } from '@proton/payments';

import { CYCLE, DEFAULT_CYCLE } from '../constants';
import type { Cycle, FreePlanDefault, SubscriptionCheckResponse } from '../interfaces';

export const FREE_PLAN: FreePlanDefault = {
    ID: 'free',
    Name: PLANS.FREE,
    PeriodEnd: {
        '1': 1702849536,
        '12': 1731879936,
        '24': 1763415936,
    },
    ParentMetaPlanID: '',
    Title: `Proton Free`,
    Type: PLAN_TYPES.PLAN,
    Currency: DEFAULT_CURRENCY,
    Cycle: DEFAULT_CYCLE,
    Amount: 0,
    MaxDomains: 0,
    MaxAddresses: 1,
    MaxSpace: 524288000,
    MaxBaseSpace: 524288000,
    MaxDriveSpace: 524288000,
    MaxCalendars: 1,
    MaxRewardSpace: 524288000,
    MaxBaseRewardSpace: 524288000,
    MaxDriveRewardSpace: 524288000,
    MaxMembers: 0,
    Offers: [],
    MaxVPN: 1,
    MaxTier: 0,
    Services: PLAN_SERVICES.MAIL + PLAN_SERVICES.VPN,
    Quantity: 1,
    State: 1,
    Features: 0,
    Pricing: {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.TWO_YEARS]: 0,
        [CYCLE.THIRTY]: 0,
        [CYCLE.FIFTEEN]: 0,
    },
};

export const getFreeCheckResult = (
    currency: Currency = DEFAULT_CURRENCY,
    cycle: Cycle = DEFAULT_CYCLE
): SubscriptionCheckResponse => {
    return {
        Amount: 0,
        AmountDue: 0,
        Proration: 0,
        Credit: 0,
        Currency: currency,
        Cycle: cycle,
        Gift: 0,
        CouponDiscount: 0,
        Coupon: null,
        PeriodEnd: 0,
        optimistic: true,
    };
};
