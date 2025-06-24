import type { Currency, Cycle } from '../interface';
import type { BasePlansMap, Plan, SubscriptionPlan } from '../plan/interface';
import type { BillingPlatform, Renew, SubscriptionPlatform } from './constants';

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
    IsTrial?: boolean;
    BillingPlatform?: BillingPlatform;
    /**
     * Contains additional subscriptions if user has multiple subscriptions.
     */
    SecondarySubscriptions?: Subscription[];
}
