import type { ADDON_NAMES, PLANS } from '../constants';
import type { Currency, Cycle, FreeSubscription } from '../interface';
import type { BasePlansMap, Plan, SubscriptionPlan } from '../plan/interface';
import type { Renew, SubscriptionPlatform, TrialType } from './constants';

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

    /**
     * Relevant for upcoming subscriptions. They can be prepaid or unpaid.
     *
     * Example 1: user has 12m vpn2024 subscription and buys 24m vpn2024. User pays immediately. The created upcoming
     * subscription is prepaid.
     *
     * Example 2: user has 12m vpn2024 subscription and buys 1m vpn2024. It create an upcoming unpaid subscription. User
     * will be charged when the current 12m subscription ends and the upcoming 1m subscription starts. The upcoming
     * subscription is marked as IsPrepaid = false at time when it's created.
     *
     * Example 3: user has a B2B plan with lumo addon. User removes one or several lumo seats. It creates an upcoming
     * unpaid subscription. Until the current subscription ends, user can still use Lumo. After that, user is charged
     * for the upcoming subscription without the lumo seats. The upcoming subscription is marked as IsPrepaid = false at
     * time when it's created.
     */
    IsPrepaid: boolean;
}

export type MaybeFreeSubscription = Subscription | FreeSubscription | undefined;

export type Coupon = {
    Code: string;
    Description: string;
    MaximumRedemptionsPerUser: number | null;
} | null;

type CouponDiscountBreakdownElementBE = {
    Name: PLANS | ADDON_NAMES;
    Amount: number;
};

/**
 * Per-line coupon discount returned by the check response: how much of the coupon discount applies to the base
 * plan vs. each individual addon. The backend returns it for any valid coupon, covering whatever plan
 * configuration was checked.
 *
 * Note: the breakdown only describes what was in *that* check. To learn the discount for an addon the user hasn't
 * selected yet (comparing the base plan against the same plan *with* the addon), a *secondary* check that
 * includes the addon must be run — see {@link runSecondarySubscriptionEstimation} (core/secondary-estimation.ts).
 */
export type CouponDiscountBreakdownBE = CouponDiscountBreakdownElementBE[];

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
          reason?: 'possibly-invalid-coupon';
      }
    | {
          forbidden: true;
          reason: 'already-subscribed' | 'already-subscribed-externally' | 'offer-not-available' | 'paid-plan-required';
      };
