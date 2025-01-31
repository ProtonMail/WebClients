import type { ADDON_NAMES, CYCLE, Currency, PLANS, PLAN_TYPES } from '@proton/payments';

import type { ProrationMode } from '../api/payments';
import type { Nullable } from './utils';

export type Cycle =
    | CYCLE.MONTHLY
    | CYCLE.YEARLY
    | CYCLE.TWO_YEARS
    | CYCLE.THIRTY
    | CYCLE.FIFTEEN
    | CYCLE.THREE
    | CYCLE.EIGHTEEN;

export interface CycleMapping<T> {
    [CYCLE.MONTHLY]?: T;
    [CYCLE.YEARLY]?: T;
    [CYCLE.TWO_YEARS]?: T;
    // Not always included for all plans
    [CYCLE.THIRTY]?: T;
    [CYCLE.FIFTEEN]?: T;
    [CYCLE.THREE]?: T;
    [CYCLE.EIGHTEEN]?: T;
}

export type Pricing = CycleMapping<number>;

export interface Offer {
    Name: string;
    StartTime: number;
    EndTime: number;
    Pricing: Partial<Pricing>;
}

export interface Plan {
    ID: string;
    ParentMetaPlanID: string;
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
    Quantity: number;
    Pricing: Pricing;
    DefaultPricing?: Pricing;
    PeriodEnd: CycleMapping<number>;
    State: number;
    Offers: Offer[];
    Vendors?: any;
}

export interface StrictPlan extends Plan {
    Type: PLAN_TYPES.PLAN;
    Name: PLANS;
}

export interface Addon extends Plan {
    Type: PLAN_TYPES.ADDON;
    Name: ADDON_NAMES;
}

export interface FreePlanDefault extends Plan {
    Name: PLANS.FREE;
    Type: PLAN_TYPES.PLAN;
    MaxBaseSpace: number;
    MaxDriveSpace: number;
    MaxRewardSpace: number;
    MaxDriveRewardSpace: number;
    MaxBaseRewardSpace: number;
}

export enum Renew {
    Disabled = 0,
    Enabled = 1,
}

export enum External {
    Default = 0,
    iOS = 1,
    Android = 2,
}

export enum BillingPlatform {
    Proton = 0,
    Chargebee = 1,
}

export interface SubscriptionPlan
    extends Omit<Plan, 'ParentMetaPlanID' | 'PeriodEnd' | 'Pricing' | 'DefaultPricing' | 'Offers'> {
    // TODO: improve
    Offer?: 'default' | string;
}

export interface Subscription {
    ID: string;
    InvoiceID: string;
    Cycle: Cycle;
    PeriodStart: number;
    /**
     * Be careful with using PeriodEnd property. Depending on the presense of UpcomingSubscription and depending
     * on the Renew state, it might be not always clear when the subscription actually ends and the user is downgraded
     * to free. Use helper {@link subscriptionExpires} to get the actual expiration date.
     */
    PeriodEnd: number;
    CreateTime: number;
    CouponCode: null | string;
    Currency: Currency;
    Amount: number;
    RenewAmount: number;
    RenewDiscount: number;
    Renew: Renew;
    Discount: number;
    Plans: SubscriptionPlan[];
    External: External;
    UpcomingSubscription?: Subscription | null;
    /**
     * That's a V5 property. It's not available for V4.
     */
    IsTrial?: boolean;
    /**
     * V5 property. Potentially isn't available in V4.
     */
    BillingPlatform?: BillingPlatform;
}

export type BasePlansMap<T extends Plan> = {
    [planName in PLANS | ADDON_NAMES]: T;
};

export type PlansMap = Partial<BasePlansMap<Plan>>;

export interface Tax {
    Name: string;
    /**
     * Tax rate in percent. For example, value can be 8.5 for 8.5%.
     */
    Rate: number;
    /**
     * Tax amount in cents. It must be an integer.
     */
    Amount: number;
}

export enum TaxInclusive {
    EXCLUSIVE = 0,
    INCLUSIVE = 1,
}

export enum SubscriptionMode {
    Regular = 0,
    CustomBillings = 1,
    ScheduledChargedImmediately = 2,
    ScheduledChargedLater = 3,
}

export type Coupon = Nullable<{
    Code: string;
    Description: string;
    MaximumRedemptionsPerUser: number | null;
}>;

export interface SubscriptionCheckResponse {
    Amount: number;
    AmountDue: number;
    Proration?: number;
    CouponDiscount?: number;
    Coupon: Coupon;
    UnusedCredit?: number;
    Credit?: number;
    Currency: Currency;
    Cycle: Cycle;
    Gift?: number;
    PeriodEnd: number;
    Taxes?: Tax[];
    TaxInclusive?: TaxInclusive;
    SubscriptionMode: SubscriptionMode;
    optimistic?: boolean;
    /**
     * This property doesn't actually exist in the response.
     * It's added by the frontend and echoes the same property from the request.
     */
    ProrationMode?: ProrationMode;
}

export enum Audience {
    B2C = 'b2c',
    B2B = 'b2b',
    FAMILY = 'family',
}
