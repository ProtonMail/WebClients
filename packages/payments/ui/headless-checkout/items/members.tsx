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

    // The displayed members amount depends on whether the coupon targets only
    // the base plan users, and whether the coupon is hidden with no addons.
    const pricePerAllPerMonth = (() => {
        if (checkoutUi.discountTarget === 'base-users') {
            return checkoutUi.withDiscountMembersPerMonth;
        }
        const noAddonsAndCouponIsHidden = !!couponConfig?.hidden && checkoutUi.addons.length === 0;
        if (noAddonsAndCouponIsHidden) {
            return checkoutUi.withDiscountPerMonth;
        }
        return checkoutUi.membersPerMonth;
    })();

    const pricePerOnePerMonth = checkoutUi.oneMemberPerMonth;
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
