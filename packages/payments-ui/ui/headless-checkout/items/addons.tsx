import type { ReactNode } from 'react';

import Price from '@proton/components/components/price/Price';
import { getAddonTitleWithQuantity, getAddonTitleWithoutQuantity } from '@proton/payments/core/checkout';
import type { ADDON_NAMES, ADDON_PREFIXES } from '@proton/payments/core/constants';
import type { Currency, Pricing } from '@proton/payments/core/interface';
import { getAddonType } from '@proton/payments/core/plan/addons';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';
import { getAddonLinePricing } from './line-discounts';

interface AddonItem {
    addonName: ADDON_NAMES;
    addonType: ADDON_PREFIXES | null;
    labelWithQuantity: string;
    labelWithoutQuantity: string;
    labelWithoutQuantityShort: string;
    quantity: number;
    pricePerOnePerMonth: number;
    pricePerOnePerMonthElement: ReactNode;
    priceForAllPerMonth: number;
    /**
     * Per-addon-line mirror of the checkout-level pricing fields. Totals cover the whole addon line
     * (all `quantity`). The undiscounted baseline is the monthly rate, so `discountPerCycle` captures both the
     * billing-cycle (term) saving and the coupon's per-addon share. With no coupon, only the term saving shows.
     */
    withoutDiscountPerMonth: number;
    withoutDiscountPerCycle: number;
    withDiscountPerCycle: number;
    withDiscountPerMonth: number;
    discountPerCycle: number;
    discountPercent: number;
    /** Raw pricing per cycle (for custom display) */
    pricing: Pricing;
    currency: Currency;
}

export const ADDONS_LINE_ITEM_TYPE = 'addons' as const;

export interface AddonLineItem extends BaseLineItem<typeof ADDONS_LINE_ITEM_TYPE>, ReturnType<typeof formatAddons> {}

function formatAddons(ctx: HeadlessCheckoutContextInner) {
    const { checkoutUi, cycle, currency, couponConfig } = ctx;
    const { couponDiscountBreakdown } = checkoutUi;

    const addons: AddonItem[] = checkoutUi.addons.map((addon) => {
        const {
            basePricePerOnePerCycle,
            basePriceForAllPerMonth,
            basePriceForAllPerCycle,
            monthlyRenewalsPriceForAllPerCycle,
            withDiscountForAllPerCycle,
            discountPerCycle,
            discountPercent,
        } = getAddonLinePricing(addon, cycle, couponDiscountBreakdown);

        const withDiscountForAllPerMonth = withDiscountForAllPerCycle / cycle;
        const withDiscountPerOnePerMonth = withDiscountForAllPerMonth / addon.quantity;

        // If the coupon is hidden from the user, then we need to display the discounted price per one per month in the
        // line item. For other cases, we display the undiscounted price, because checkout will display the aggregated
        // discount as a separate line item.
        const pricePerOnePerMonth = couponConfig?.hidden ? withDiscountPerOnePerMonth : basePricePerOnePerCycle / cycle;
        const priceForAllPerMonth = couponConfig?.hidden ? withDiscountForAllPerMonth : basePriceForAllPerCycle / cycle;

        const pricePerOnePerMonthElement = <Price currency={currency}>{pricePerOnePerMonth}</Price>;

        return {
            addonName: addon.name,
            addonType: getAddonType(addon.name),
            labelWithQuantity: getAddonTitleWithQuantity(addon.name, addon.quantity, checkoutUi.planIDs),
            labelWithoutQuantity: getAddonTitleWithoutQuantity(addon.name, checkoutUi.planIDs),
            labelWithoutQuantityShort: getAddonTitleWithoutQuantity(addon.name, checkoutUi.planIDs, { short: true }),
            quantity: addon.quantity,
            pricePerOnePerMonth,
            pricePerOnePerMonthElement,
            priceForAllPerMonth,
            withoutDiscountPerMonth: basePriceForAllPerMonth,
            withoutDiscountPerCycle: monthlyRenewalsPriceForAllPerCycle,
            withDiscountPerCycle: withDiscountForAllPerCycle,
            withDiscountPerMonth: withDiscountForAllPerMonth,
            discountPerCycle,
            discountPercent,
            pricing: addon.pricing,
            currency,
        } satisfies AddonItem;
    });

    return {
        addons,
        visible: addons.length > 0,
    };
}

export function createAddonItem(ctx: HeadlessCheckoutContextInner): AddonLineItem {
    return {
        type: ADDONS_LINE_ITEM_TYPE,
        ...formatAddons(ctx),
    };
}
