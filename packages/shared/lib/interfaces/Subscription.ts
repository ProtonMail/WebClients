import { CYCLE, PLAN_TYPES, PLANS, ADDON_NAMES } from '../constants';

export type Currency = 'EUR' | 'CHF' | 'USD';
export type Cycle = CYCLE.MONTHLY | CYCLE.YEARLY | CYCLE.TWO_YEARS;

export interface Pricing {
    [CYCLE.MONTHLY]: number;
    [CYCLE.YEARLY]: number;
    [CYCLE.TWO_YEARS]: number;
}

export type MaxKeys = 'MaxDomains' | 'MaxAddresses' | 'MaxSpace' | 'MaxMembers' | 'MaxVPN' | 'MaxTier';

export interface Plan {
    ID: string;
    Type: PLAN_TYPES;
    Cycle: Cycle;
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
    Cycle: Cycle;
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

export interface Additions {
    [ADDON_NAMES.ADDRESS]?: number;
    [ADDON_NAMES.DOMAIN]?: number;
    [ADDON_NAMES.MEMBER]?: number;
    [ADDON_NAMES.SPACE]?: number;
    [ADDON_NAMES.VPN]?: number;
}

export interface SubscriptionCheckResponse {
    Amount: number;
    AmountDue: number;
    Proration?: number;
    CouponDiscount?: number;
    Coupon: null | {
        Code: string;
        Description: string;
    };
    UnusedCredit?: number;
    Credit?: number;
    Currency: Currency;
    Cycle: Cycle;
    Gift?: number;
    Additions: null | Additions;
    PeriodEnd: number;
}
