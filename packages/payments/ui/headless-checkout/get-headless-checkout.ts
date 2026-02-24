import { c } from 'ttag';

import type { APP_NAMES } from '@proton/shared/lib/constants';

import { getCheckoutUi } from '../../core/checkout';
import { getCheckoutModifiers } from '../../core/checkout-modifiers';
import { computeOptimisticCheckResult } from '../../core/computeOptimisticCheckResult';
import type { FreeSubscription, PlanIDs } from '../../core/interface';
import { getIsB2BAudienceFromPlan, isLifetimePlanSelected } from '../../core/plan/helpers';
import type { PlansMap } from '../../core/plan/interface';
import { hasPlanIDs } from '../../core/planIDs';
import { SubscriptionMode, TaxInclusive } from '../../core/subscription/constants';
import type {
    Subscription,
    SubscriptionCheckForbiddenReason,
    SubscriptionEstimation,
} from '../../core/subscription/interface';
import { ADDONS_LINE_ITEM_TYPE, type AddonLineItem, createAddonItem } from './items/addons';
import { AMOUNT_DUE_LINE_ITEM_TYPE, type AmountDueLineItem, createAmountDueItem } from './items/amount-due';
import { BILLING_CYCLE_LINE_ITEM_TYPE, type BillingCycleLineItem, createBillingCycleItem } from './items/billing-cycle';
import { COUPON_LINE_ITEM_TYPE, type CouponLineItem, createCouponItem } from './items/coupon';
import { CREDIT_LINE_ITEM_TYPE, type CreditLineItem, createCreditItem } from './items/credit';
import { DISCOUNT_LINE_ITEM_TYPE, type DiscountLineItem, createDiscountItem } from './items/discount';
import { GIFT_LINE_ITEM_TYPE, type GiftLineItem, createGiftItem } from './items/gift';
import { MEMBERS_LINE_ITEM_TYPE, type MembersLineItem, createMembersItem } from './items/members';
import { NEXT_BILLING_LINE_ITEM_TYPE, type NextBillingLineItem, createNextBillingItem } from './items/next-billing';
import { PLAN_AMOUNT_LINE_ITEM_TYPE, type PlanAmountLineItem, createPlanAmountItem } from './items/plan-amount';
import {
    PLAN_AMOUNT_WITH_DISCOUNT_LINE_ITEM_TYPE,
    type PlanAmountWithDiscountLineItem,
    createNetAmountItem,
} from './items/plan-amount-with-discount';
import { PRORATION_LINE_ITEM_TYPE, type ProrationLineItem, createProrationItem } from './items/proration';
import {
    RENEWAL_NOTICE_LINE_ITEM_TYPE,
    type RenewalNoticeLineItem,
    createRenewalNoticeItem,
} from './items/renewal-notice';
import { TAX_EXCLUSIVE_LINE_ITEM_TYPE, type TaxExclusiveLineItem, createTaxExclusiveItem } from './items/tax-exclusive';
import { TAX_INCLUSIVE_LINE_ITEM_TYPE, type TaxInclusiveLineItem, createTaxInclusiveItem } from './items/tax-inclusive';
import { UNUSED_CREDIT_LINE_ITEM_TYPE, type UnusedCreditLineItem, createUnusedCreditItem } from './items/unused-credit';
import { formatTax } from './tax-helpers';

export type CheckoutLineItem =
    | BillingCycleLineItem
    | MembersLineItem
    | AddonLineItem
    | PlanAmountLineItem
    | DiscountLineItem
    | ProrationLineItem
    | UnusedCreditLineItem
    | CouponLineItem
    | CreditLineItem
    | GiftLineItem
    | PlanAmountWithDiscountLineItem
    | TaxExclusiveLineItem
    | NextBillingLineItem
    | AmountDueLineItem
    | RenewalNoticeLineItem
    | TaxInclusiveLineItem;

/**
 * A record that maps each CheckoutLineItem type discriminant to its
 * corresponding concrete item. Every key is always present, so lookups
 * never return `undefined`.
 */
export type CheckoutLineItems = {
    [K in CheckoutLineItem['type']]: Extract<CheckoutLineItem, { type: K }>;
};

/**
 * Minimal coupon config - only the `hidden` flag is used by the headless
 * checkout. Avoids a dependency on @proton/components' full CouponConfig.
 */
export interface HeadlessCheckoutCouponConfig {
    /**
     * When true, the coupon discount is hidden from display and the total
     * billing amount uses withDiscountPerCycle instead of checkResult.Amount.
     */
    hidden?: boolean;
}

/**
 * Input parameters for getHeadlessCheckout
 */
export interface GetHeadlessCheckoutParams {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    checkResult: SubscriptionEstimation;
    /**
     * Whether the current checkout is for a trial. Auto-detected from checkResult if not provided. This property is
     * meant to tell the system if user intends to start a trial, or make a trial-to-trial modification.
     */
    isTrial?: boolean;
    couponConfig?: HeadlessCheckoutCouponConfig;
    app: APP_NAMES;
    /** Current subscription - used for renewal notice and start-date line items. */
    subscription?: Subscription | FreeSubscription;
    /** Payment forbidden reason - used to determine renewal notice visibility. */
    paymentForbiddenReason?: SubscriptionCheckForbiddenReason;
}

export type HeadlessCheckoutContextInner = ReturnType<typeof createHeadlessCheckoutContextInner>;

export function createHeadlessCheckoutContextInner(params: GetHeadlessCheckoutParams) {
    const { planIDs, plansMap, checkResult, couponConfig, app, subscription, paymentForbiddenReason } = params;

    // Core computed checkout data
    const checkoutUi = getCheckoutUi({ planIDs, plansMap, checkResult });
    const modifiers = getCheckoutModifiers(checkResult);
    const tax = formatTax(checkResult);

    const optimisticCheckResult = computeOptimisticCheckResult(
        { planIDs, plansMap, cycle: checkoutUi.cycle, currency: checkoutUi.currency },
        subscription,
        { isTrial: params.isTrial }
    );
    const optimisticCheckoutUi = getCheckoutUi({ planIDs, plansMap, checkResult: optimisticCheckResult });

    // Derived flags
    const isPaidPlan = hasPlanIDs(planIDs);
    const isFreePlan = !isPaidPlan;
    const isLifetime = isLifetimePlanSelected(planIDs);
    const isTrial = params.isTrial ?? checkResult.SubscriptionMode === SubscriptionMode.Trial;

    // Tax flags
    const isTaxExclusive = tax?.inclusive === TaxInclusive.EXCLUSIVE && tax.amount > 0;
    const isTaxInclusive = tax?.inclusive === TaxInclusive.INCLUSIVE;

    // Plan title with baked-in fallbacks
    const planTitle = isFreePlan ? c('Payments.plan_name').t`Free` : checkoutUi.planTitle;

    return {
        // Original params (minus isTrial which is resolved)
        planIDs,
        plansMap,
        checkResult,
        couponConfig,
        app,
        subscription,
        paymentForbiddenReason,

        // Computed
        checkoutUi,
        modifiers,
        tax,
        isPaidPlan,
        isFreePlan,
        isLifetime,
        /** Resolved trial flag (from explicit param or auto-detected from checkResult) */
        isTrial,
        isTaxExclusive,
        isTaxInclusive,
        /** Plan title with baked-in fallbacks */
        planTitle,
        planName: checkoutUi.planName,

        currency: checkoutUi.currency,
        cycle: checkoutUi.cycle,
        optimisticCheckResult,
        optimisticCheckoutUi,
    };
}

export type HeadlessCheckout = ReturnType<typeof getHeadlessCheckout>;

export function getHeadlessCheckout(params: GetHeadlessCheckoutParams) {
    const ctx = createHeadlessCheckoutContextInner(params);

    const items: CheckoutLineItems = {
        [BILLING_CYCLE_LINE_ITEM_TYPE]: createBillingCycleItem(ctx),
        [MEMBERS_LINE_ITEM_TYPE]: createMembersItem(ctx),
        [ADDONS_LINE_ITEM_TYPE]: createAddonItem(ctx),
        [PLAN_AMOUNT_LINE_ITEM_TYPE]: createPlanAmountItem(ctx),
        [DISCOUNT_LINE_ITEM_TYPE]: createDiscountItem(ctx),
        [PRORATION_LINE_ITEM_TYPE]: createProrationItem(ctx),
        [UNUSED_CREDIT_LINE_ITEM_TYPE]: createUnusedCreditItem(ctx),
        [COUPON_LINE_ITEM_TYPE]: createCouponItem(ctx),
        [CREDIT_LINE_ITEM_TYPE]: createCreditItem(ctx),
        [GIFT_LINE_ITEM_TYPE]: createGiftItem(ctx),
        [PLAN_AMOUNT_WITH_DISCOUNT_LINE_ITEM_TYPE]: createNetAmountItem(ctx),
        [TAX_EXCLUSIVE_LINE_ITEM_TYPE]: createTaxExclusiveItem(ctx),
        [NEXT_BILLING_LINE_ITEM_TYPE]: createNextBillingItem(ctx),
        [AMOUNT_DUE_LINE_ITEM_TYPE]: createAmountDueItem(ctx),
        [RENEWAL_NOTICE_LINE_ITEM_TYPE]: createRenewalNoticeItem(ctx),
        [TAX_INCLUSIVE_LINE_ITEM_TYPE]: createTaxInclusiveItem(ctx),
    };

    const isB2B = getIsB2BAudienceFromPlan(ctx.checkoutUi.planName);

    return {
        /** Resolved plan title with fallbacks: "Free" for free plans, PLAN_NAMES value for lifetime, plan.Title for others */
        planTitle: ctx.planTitle,
        planName: ctx.planName,
        isPaidPlan: ctx.isPaidPlan,
        isLifetime: ctx.isLifetime,
        isTrial: ctx.isTrial,
        isB2B,
        isB2C: !isB2B,

        isTaxInclusive: ctx.isTaxInclusive,
        isTaxExclusive: ctx.isTaxExclusive,

        items,

        getItem: <T extends CheckoutLineItem['type']>(type: T): CheckoutLineItems[T] => items[type],

        checkoutUi: ctx.checkoutUi,
        checkResult: ctx.checkResult,

        planIDs: ctx.planIDs,

        modifiers: ctx.modifiers,
    };
}
