import type { ReactNode } from 'react';

import type { CYCLE, PLANS, PlanIDs, PlansMap } from '@proton/payments';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { StrictRequired } from '@proton/shared/lib/interfaces';

export type CouponConfigProps = {
    checkResult: SubscriptionEstimation | undefined;
    planIDs: PlanIDs;
    plansMap: PlansMap;
};

export type CouponConfigRequiredProps = StrictRequired<CouponConfigProps>;

export function isCouponConfigRequiredProps(props: CouponConfigProps): props is CouponConfigRequiredProps {
    return props.checkResult !== undefined;
}

export type CouponConfig = {
    /**
     * The coupon codes that trigger this config.
     */
    coupons: string | string[];

    /**
     * If the config matches any of the special cases, then it will be considered a campaign config as well. Example:
     * for BF2025 we wanted to enable vpn2024 15m deal WITHOUT any coupon code. So this was the ad-hoc solution.
     */
    specialCases?: {
        planName: PLANS;
        cycle: CYCLE;
    }[];
    /**
     * If set to true then the coupon will not be displayed in the UI. It hides the coupon and "coupon discount" number.
     * In addition, it changes the displayed price per user and total. These amounts now include the discount.
     */
    hidden: boolean;
    /**
     * If this react function is defined then it will render a text right below the "amount due" text. Can be helpful
     * to display some custom promotion messages. If not specified then this component isn't present at all.
     */
    amountDueMessage?: (props: CouponConfigRequiredProps) => ReactNode;

    /**
     * Replaces the text on the payment confirmation button.
     */
    payCTA?: (props: CouponConfigRequiredProps) => string;

    /**
     * You can override the subscription modal subtitle with this function.
     */
    checkoutSubtitle?: () => ReactNode;
    /**
     * This function adds a price comparison component inside the cycle selector. It's not present by default.
     * It can be used to highlight that the old price was *this high*. You can return any react node from it really,
     * but the primary idea was returning the <Price> component from it.
     */
    cyclePriceCompare?: (params: { cycle: CYCLE; suffix?: string }, config: CouponConfigRequiredProps) => ReactNode;

    /**
     * Where to put the new element: before or after the original one. By default it's after.
     */
    cyclePriceComparePosition?: 'before' | 'after';

    /**
     * You can override the cycle title with this function. It can change the usual "1 month" or "12 months" title to
     * something else.
     */
    cycleTitle?: (params: { cycle: CYCLE }, config: CouponConfigRequiredProps) => ReactNode;

    /**
     * If set, this will limit the cycles that are available in the cycle selector.
     */
    availableCycles?: CYCLE[];

    /**
     * If user has a migration coupon then they will lose it if they accept the new deal. If this property is set to
     * true then a warning will be displayed to the user.
     */
    showMigrationDiscountLossWarning?: boolean;

    /**
     * If set to true then the Lumo addon banner will not be displayed.
     */
    hideLumoAddonBanner?: boolean;

    /**
     * If set to true then the currency selector will be disabled or hidden.
     */
    disableCurrencySelector?: boolean;

    /**
     * If set to true then the manual entry of the coupon will be blocked.
     */
    blockManualEntryOfCoupon?: boolean;
};

export type CyclePriceCompareFirstParam = Parameters<NonNullable<CouponConfig['cyclePriceCompare']>>[0];
export type CyclePriceCompareReturnType = ReturnType<NonNullable<CouponConfig['cyclePriceCompare']>>;

export type CycleTitleFirstParam = Parameters<NonNullable<CouponConfig['cycleTitle']>>[0];
export type CycleTitleReturnType = ReturnType<NonNullable<CouponConfig['cycleTitle']>>;
