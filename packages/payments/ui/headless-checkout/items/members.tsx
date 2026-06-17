import Price from '@proton/components/components/price/Price';

import { getAddonTitleByType } from '../../../core/checkout';
import { ADDON_PREFIXES } from '../../../core/constants';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const MEMBERS_LINE_ITEM_TYPE = 'members' as const;

export interface MembersLineItem
    extends BaseLineItem<typeof MEMBERS_LINE_ITEM_TYPE>, ReturnType<typeof formatMembers> {}

function formatMembers(ctx: HeadlessCheckoutContextInner) {
    const { checkoutUi, couponConfig, isPaidPlan, currency } = ctx;

    const { couponDiscountBreakdown } = checkoutUi;

    const pricePerAllPerMonth = (() => {
        // If coupon is hidden from the user, then we need to inline the discount calculation to the addons, including
        // members
        if (!!couponConfig?.hidden) {
            // legacy flow - will be removed once backend supports coupon breakdown
            if (checkoutUi.addons.length === 0) {
                return checkoutUi.withDiscountPerMonth;
            } else if (couponDiscountBreakdown) {
                // Warning: this code implicitly assumes that the discount for the base plan and for the member addons
                // is the same. When we create the coupons, we are following this structure, so the assumption holds.
                // This comment highlights it in case we every need to make it more flexible.
                return checkoutUi.membersPerMonth - Math.abs(couponDiscountBreakdown.basePlanPerMonthDiscount);
            }
        }

        // If the coupon isn't configured as hidden from the user then we don't display the discounted amounts for
        // members and other addons, and display only the cumulative discount as a separate line item.
        return checkoutUi.membersPerMonth;
    })();

    // When a hidden coupon inlines its discount into the members line, `pricePerAllPerMonth` is discounted but
    // `oneMemberPerMonth` is still the full per-seat price. Scale the per-seat price by the same ratio the total
    // was discounted by, so `pricePerOnePerMonth * users` still reconciles with `pricePerAllPerMonth`. Without a
    // breakdown the ratio is 1 (no-op); the `membersPerMonth !== 0` guard avoids a divide-by-zero. Only the VPN
    // single-signup PaymentSummary consumes this, on its B2B (users > 1) branch.
    const pricePerOnePerMonth =
        couponDiscountBreakdown && checkoutUi.membersPerMonth !== 0
            ? checkoutUi.oneMemberPerMonth * (pricePerAllPerMonth / checkoutUi.membersPerMonth)
            : checkoutUi.oneMemberPerMonth;
    const pricePerOnePerMonthElement = <Price currency={currency}>{pricePerOnePerMonth}</Price>;

    return {
        /** e.g. "1 user" or "3 users" */
        labelWithQuantity: checkoutUi.usersTitle,
        labelWithoutQuantity: getAddonTitleByType(ADDON_PREFIXES.MEMBER, true),
        /** Total members price per month (all users combined) */
        pricePerAllPerMonth,
        pricePerAllPerMonthElement: <Price currency={currency}>{pricePerAllPerMonth}</Price>,
        pricePerOnePerMonth,
        pricePerOnePerMonthElement,
        currency,
        visible: isPaidPlan,
        /** Shows the total number of users */
        totalUsers: checkoutUi.viewUsers,
    };
}

export function createMembersItem(ctx: HeadlessCheckoutContextInner): MembersLineItem {
    return {
        type: MEMBERS_LINE_ITEM_TYPE,
        ...formatMembers(ctx),
    };
}
