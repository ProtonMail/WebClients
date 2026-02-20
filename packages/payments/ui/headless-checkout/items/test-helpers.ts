import { APPS } from '@proton/shared/lib/constants';

import { CYCLE, PLAN_TYPES } from '../../../core/constants';
import type { Pricing } from '../../../core/interface';
import type { Plan } from '../../../core/plan/interface';

export const makePricing = (monthly: number, yearly?: number, twoYears?: number): Pricing =>
    ({
        [CYCLE.MONTHLY]: monthly,
        ...(yearly !== undefined ? { [CYCLE.YEARLY]: yearly } : {}),
        ...(twoYears !== undefined ? { [CYCLE.TWO_YEARS]: twoYears } : {}),
    }) as Pricing;

export const makePlan = (overrides: Partial<Plan>): Plan =>
    ({
        Type: PLAN_TYPES.PLAN,
        MaxMembers: 0,
        MaxDomains: 0,
        Pricing: makePricing(0),
        DefaultPricing: makePricing(0),
        ...overrides,
    }) as Plan;

export const makeAddon = (overrides: Partial<Plan>): Plan =>
    ({
        Type: PLAN_TYPES.ADDON,
        MaxMembers: 0,
        MaxDomains: 0,
        Pricing: makePricing(0),
        DefaultPricing: makePricing(0),
        ...overrides,
    }) as Plan;

export const makeCheckResult = (overrides: Partial<any> = {}): any => ({
    Amount: 4788,
    AmountDue: 4788,
    Coupon: null,
    CouponDiscount: 0,
    Proration: 0,
    Credit: 0,
    Gift: 0,
    Currency: 'USD',
    Cycle: CYCLE.YEARLY,
    PeriodEnd: Math.floor(Date.now() / 1000 + 365 * 24 * 60 * 60),
    SubscriptionMode: 'Regular',
    BaseRenewAmount: null,
    RenewCycle: null,
    ...overrides,
});

export const defaultApp = APPS.PROTONMAIL;
