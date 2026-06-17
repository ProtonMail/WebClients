import type { ReactNode } from 'react';

import Price from '@proton/components/components/price/Price';

import { getAddonTitleWithQuantity, getAddonTitleWithoutQuantity } from '../../../core/checkout';
import type { ADDON_NAMES, ADDON_PREFIXES } from '../../../core/constants';
import { CYCLE } from '../../../core/constants';
import type { Currency, Pricing } from '../../../core/interface';
import { getAddonType } from '../../../core/plan/addons';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

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
        const basePricePerOnePerMonth = addon.pricing[CYCLE.MONTHLY] || 0;
        const basePriceForAllPerMonth = addon.quantity * basePricePerOnePerMonth;
        const basePricePerOnePerCycle = addon.pricing[cycle] || 0;
        const basePriceForAllPerCycle = addon.quantity * basePricePerOnePerCycle;
        // Worst-case scenario price. How much would user pay if they didn't have any discount and decided to pay for
        // the selected cycle as a set of monthly renewals instead of just bying the selected cycle once. Example: item
        // costs 9.99/month or 95.88/year (7.99/month). In this case the extrapolated price would be 119.88/year.
        const extrapolatedPriceForAllPerCycle = basePriceForAllPerMonth * cycle;

        // Per-line breakdown lets us apply the addon's coupon share; 0 when absent. The breakdown covers whatever
        // the rendered check included. For an addon the user hasn't added to the base plan, the discounted figure
        // comes from a secondary check that includes it — see runSecondarySubscriptionEstimation
        // (core/secondary-estimation.ts).
        const couponDiscountPerCycle = Math.abs(couponDiscountBreakdown?.perAddonPerCycleDiscount[addon.name] ?? 0);

        const withDiscountForAllPerCycle = basePriceForAllPerCycle - couponDiscountPerCycle;
        const withDiscountForAllPerMonth = withDiscountForAllPerCycle / cycle;
        const withDiscountPerOnePerMonth = withDiscountForAllPerMonth / addon.quantity;

        const discountPerCycle = extrapolatedPriceForAllPerCycle - withDiscountForAllPerCycle;
        const discountPercent =
            extrapolatedPriceForAllPerCycle > 0
                ? Math.round(100 * (discountPerCycle / extrapolatedPriceForAllPerCycle))
                : 0;

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
            withoutDiscountPerCycle: extrapolatedPriceForAllPerCycle,
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
