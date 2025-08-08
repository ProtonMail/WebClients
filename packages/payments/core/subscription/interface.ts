import type { Nullable } from '@proton/shared/lib/interfaces';

import { type ProrationMode } from '../api';
import type { Currency, Cycle } from '../interface';
import type { BasePlansMap, Plan, SubscriptionPlan } from '../plan/interface';
import type { BillingPlatform, Renew, SubscriptionMode, SubscriptionPlatform, TaxInclusive } from './constants';

export type FullPlansMap = BasePlansMap<Plan>;

export interface Subscription {
    ID: string;
    InvoiceID: string;
    Cycle: Cycle;
    /**
     * When the current subscription started.
     */
    PeriodStart: number;
    /**
     * Be careful with using PeriodEnd property. Depending on the presense of UpcomingSubscription and depending
     * on the Renew state, it might be not always clear when the subscription actually ends and the user is downgraded
     * to free. Use helper {@link subscriptionExpires} to get the actual expiration date.
     */
    PeriodEnd: number;
    /**
     * When the initial subscription was created. Unlike PeriodStart, this property doesn't change when subscription is
     * renewed.
     */
    CreateTime: number;
    CouponCode: null | string;
    Currency: Currency;
    Amount: number;
    RenewAmount: number;
    RenewDiscount: number;
    Renew: Renew;
    Discount: number;
    Plans: SubscriptionPlan[];
    External: SubscriptionPlatform;
    UpcomingSubscription?: Subscription | null;
    IsTrial: boolean;
    BillingPlatform?: BillingPlatform;
    /**
     * Contains additional subscriptions if user has multiple subscriptions.
     */
    SecondarySubscriptions?: Subscription[];
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
    BaseRenewAmount: number | null;
    RenewCycle: Cycle | null;
}

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
