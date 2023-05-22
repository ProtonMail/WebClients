import { CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE, PLANS, PLAN_SERVICES, PLAN_TYPES } from '../constants';
import { Currency, Cycle, Plan, SubscriptionCheckResponse } from '../interfaces';

export const FREE_PLAN = {
    ID: 'free',
    Name: 'free' as PLANS,
    Title: `Proton Free`,
    Type: PLAN_TYPES.PLAN,
    Currency: DEFAULT_CURRENCY,
    Cycle: DEFAULT_CYCLE,
    Amount: 0,
    MaxDomains: 0,
    MaxAddresses: 1,
    MaxSpace: 524288000,
    MaxMembers: 0,
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
} as Plan;

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
        Additions: null,
        PeriodEnd: 0,
    };
};
