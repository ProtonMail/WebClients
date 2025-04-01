import type { Currency, Cycle } from '../interface';
import type { BasePlansMap, Plan, SubscriptionPlan } from '../plan/interface';
import type { BillingPlatform, External, Renew } from './constants';

export type FullPlansMap = BasePlansMap<Plan>;

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
