import { CYCLE, PLAN_TYPES, PLANS, ADDON_NAMES } from '../constants';

type Currency = 'EUR' | 'CHF' | 'USD';

export interface Pricing {
    [CYCLE.MONTHLY]: number;
    [CYCLE.YEARLY]: number;
    [CYCLE.TWO_YEARS]: number;
}

export type MaxKeys = 'MaxDomains' | 'MaxAddresses' | 'MaxSpace' | 'MaxMembers' | 'MaxVPN' | 'MaxTier';

export interface Plan {
    ID: string;
    Type: PLAN_TYPES;
    Cycle: CYCLE;
    Name: PLANS | ADDON_NAMES;
    Title: string;
    Currency: Currency;
    Amount: number;
    MaxDomains: number;
    MaxAddresses: number;
    MaxSpace: number;
    MaxMembers: number;
    MaxVPN: number;
    MaxTier: number;
    Services: number;
    Features: number;
    Quantity: number;
    Pricing: Pricing;
}

export interface Subscription {
    ID: string;
    InvoiceID: string;
    Cycle: CYCLE;
    PeriodStart: number;
    PeriodEnd: number;
    CouponCode: null | string;
    Currency: Currency;
    Amount: number;
    Plans: Plan[];
}

export type PlanIDs = {
    [planID: string]: number;
};
