import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '../constants';

export type Currency = 'EUR' | 'CHF' | 'USD';
export type Cycle = CYCLE.MONTHLY | CYCLE.YEARLY | CYCLE.TWO_YEARS | CYCLE.THIRTY | CYCLE.FIFTEEN;

export interface Pricing {
    [CYCLE.MONTHLY]: number;
    [CYCLE.YEARLY]: number;
    [CYCLE.TWO_YEARS]: number;
    // Not always included for all plans
    [CYCLE.THIRTY]?: number;
    [CYCLE.FIFTEEN]?: number;
}

export type MaxKeys = 'MaxDomains' | 'MaxAddresses' | 'MaxSpace' | 'MaxMembers' | 'MaxVPN' | 'MaxTier' | 'MaxIPs';

export type Quantity = number;

export interface Offer {
    Name: string;
    StartTime: number;
    EndTime: number;
    Pricing: Partial<Pricing>;
}

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
    DefaultPricing?: Pricing;
    State: number;
    Offers: Offer[];
}

export const getPlanMaxIPs = (plan: Plan) => {
    if (plan.Name === PLANS.VPN_BUSINESS || plan.Name === ADDON_NAMES.IP_VPN_BUSINESS) {
        return 1;
    }

    return 0;
};

export enum Renew {
    Disabled = 0,
    Enabled = 1,
}

export enum External {
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
    Renew: Renew;
    Discount: number;
    Plans: Plan[];
    External: External;
}

export interface SubscriptionModel extends Subscription {
    isManagedByMozilla: boolean;
    UpcomingSubscription?: Subscription | null;
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
    FAMILY = 2,
}
