import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '../constants';

export type Currency = 'EUR' | 'CHF' | 'USD';
export type Cycle = CYCLE.MONTHLY | CYCLE.YEARLY | CYCLE.TWO_YEARS;

export interface Pricing {
    [CYCLE.MONTHLY]: number;
    [CYCLE.YEARLY]: number;
    [CYCLE.TWO_YEARS]: number;
}

export type MaxKeys = 'MaxDomains' | 'MaxAddresses' | 'MaxSpace' | 'MaxMembers' | 'MaxVPN' | 'MaxTier';

export type Quantity = number;

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
    MaxCalendars: number;
    MaxMembers: number;
    MaxVPN: number;
    MaxTier: number;
    Services: number;
    Features: number;
    Quantity: Quantity;
    Pricing: Pricing;
    State: number;
}

enum External {
    Default = 0,
    iOS = 1,
    Android = 2,
}

export interface Subscription {
    ID: string;
    InvoiceID: string;
    Cycle: Cycle;
    PeriodStart: number;
    PeriodEnd: number;
    CreateTime: number;
    CouponCode: null | string;
    Currency: Currency;
    Amount: number;
    RenewAmount: number;
    Plans: Plan[];
    External: External;
}

export interface SubscriptionModel extends Subscription {
    isManagedByMozilla: boolean;
}

export type PlanIDs = Partial<{
    [planName in PLANS | ADDON_NAMES]: Quantity;
}>;

export type PlansMap = Partial<{
    [planName in PLANS | ADDON_NAMES]: Plan;
}>;

export interface Additions {
    [ADDON_NAMES.ADDRESS]?: number;
    [ADDON_NAMES.DOMAIN]?: number;
    [ADDON_NAMES.DOMAIN_ENTERPRISE]?: number;
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]?: number;
    [ADDON_NAMES.MEMBER]?: number;
    [ADDON_NAMES.SPACE]?: number;
    [ADDON_NAMES.VPN]?: number;
    [ADDON_NAMES.MEMBER_MAIL_PRO]?: number;
    [ADDON_NAMES.MEMBER_DRIVE_PRO]?: number;
    [ADDON_NAMES.MEMBER_BUNDLE_PRO]?: number;
    [ADDON_NAMES.MEMBER_ENTERPRISE]?: number;
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

export enum Audience {
    B2C = 0,
    B2B = 1,
}
