import type { Nullable } from '@proton/shared/lib/interfaces';

import type { CheckSubscriptionData, ProrationMode } from '../api/api';
import type { Currency, Cycle, PlanIDs } from '../interface';
import type { BasePlansMap, Plan, SubscriptionPlan } from '../plan/interface';
import type { Renew, SubscriptionMode, SubscriptionPlatform, TaxInclusive, TrialType } from './constants';

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
    /**
     * The amount that will be charged for the next subscription. It includes all discounts. The amount is in cents.
     */
    RenewAmount: number;
    /**
     * The full amount of the next subscription term. It doesn't include any discounts. The amount is in cents.
     */
    BaseRenewAmount: number;
    RenewDiscount: number;
    Renew: Renew;
    Discount: number;
    Plans: SubscriptionPlan[];
    External: SubscriptionPlatform;
    UpcomingSubscription?: Subscription | null;
    IsTrial: boolean;
    TrialType?: TrialType | null;
    /**
     * Contains additional subscriptions if user has multiple subscriptions.
     */
    SecondarySubscriptions?: Subscription[];
    /**
     * The cycle of the next subscription term. It's introduced in P2-1435 to handle edge cases for users with variable
     * cycle offers.
     */
    RenewCycle: Cycle;
}

type CouponBase = {
    Code: string;
    Description: string;
    MaximumRedemptionsPerUser: number | null;
};

export type Coupon = Nullable<CouponBase>;

export type EnrichedCoupon = Nullable<
    CouponBase & {
        Targets?: PlanIDs;
    }
>;

interface SubscriptionCheckResponse {
    /**
     * Full amount for the selected subscription. It doesn't include any discounts. The amount is in cents.
     */
    Amount: number;
    /**
     * Amount that will be charged for the selected subscription. It includes all discounts and taxes. This is the
     * amount that the user will pay. The amount is in cents.
     */
    AmountDue: number;
    /**
     * If user has an active subscription and selects another plan, then in some cases the new subscription can be
     * prorated. Proration means that the amount due will be lowered corresponding to the unused days from the previous
     * subscription. The amount is in cents.
     */
    Proration?: number;
    /**
     * Coupon discount. The amount is in cents.
     */
    CouponDiscount?: number;
    Coupon: EnrichedCoupon;
    /**
     * In case of custom billings, the property will show the discount when user adds an addon mid-cycle. This property
     * is kind of "proration for custom billings". The amount is in cents.
     */
    UnusedCredit?: number;
    /**
     * How many credits will be subtracted or added to the user account. Subtraction can happen if user has credits.
     * Credits can be added e.g. if user already has a subscription and the new one is cheaper. Then the new
     * subscription will be paid with the prorated amount and the rest will be added as credits. The amount is in cents.
     */
    Credit?: number;
    Currency: Currency;
    Cycle: Cycle;
    /**
     * Discount from a gift code. The amount is in cents.
     */
    Gift?: number;
    /**
     * When the subscription will end. Unix seconds.
     */
    PeriodEnd: number;
    Taxes?: Tax[];
    TaxInclusive?: TaxInclusive;
    /**
     * Subscription mode dictates when subscription starts and what exactly user pays for.
     */
    SubscriptionMode: SubscriptionMode;
    /**
     * The property doesn't exist on the backend. If the check response is created by the frontend then it should be
     * considered optimistic.
     */
    optimistic?: boolean;
    /**
     * This property doesn't actually exist in the response.
     * It's added by the frontend and echoes the same property from the request.
     */
    ProrationMode?: ProrationMode;
    /**
     * Sometimes amount for the second subscription term (renew amount) is different from the first one. In this case
     * this property will have the renew amount.
     */
    BaseRenewAmount: number | null;
    /**
     * Sometimes cycle for the second subscription term (renew cycle) is different from the first one. In this case
     * this property will have the renew cycle.
     */
    RenewCycle: Cycle | null;
}

export type SubscriptionEstimation = SubscriptionCheckResponse & {
    requestData: CheckSubscriptionData;
};

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

export type SubscriptionCheckForbiddenReason =
    | {
          forbidden: false;
          reason?: never;
      }
    | {
          forbidden: true;
          reason: 'already-subscribed' | 'already-subscribed-externally' | 'offer-not-available';
      };
