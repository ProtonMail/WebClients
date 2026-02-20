import type { ReactNode } from 'react';

import Price from '@proton/components/components/price/Price';

import { getAddonTitleWithQuantity, getAddonTitleWithoutQuantity } from '../../../core/checkout';
import type { ADDON_NAMES, ADDON_PREFIXES } from '../../../core/constants';
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
    /** Total addon price per month (quantity * pricePerAddon) */
    priceForAllPerMonth: number;
    priceForAllPerMonthElement: ReactNode;
    /** Raw pricing per cycle (for custom display) */
    pricing: Pricing;
    currency: Currency;
}

export const ADDONS_LINE_ITEM_TYPE = 'addons' as const;

export interface AddonLineItem extends BaseLineItem<typeof ADDONS_LINE_ITEM_TYPE>, ReturnType<typeof formatAddons> {}

function formatAddons(ctx: HeadlessCheckoutContextInner) {
    const { checkoutUi, cycle, currency } = ctx;

    const addons: AddonItem[] = checkoutUi.addons.map((addon) => {
        const pricePerOnePerMonth = (addon.pricing[cycle] || 0) / cycle;

        return {
            addonName: addon.name,
            addonType: getAddonType(addon.name),
            labelWithQuantity: getAddonTitleWithQuantity(addon.name, addon.quantity, checkoutUi.planIDs),
            labelWithoutQuantity: getAddonTitleWithoutQuantity(addon.name, checkoutUi.planIDs),
            labelWithoutQuantityShort: getAddonTitleWithoutQuantity(addon.name, checkoutUi.planIDs, { short: true }),
            quantity: addon.quantity,
            pricePerOnePerMonth,
            pricePerOnePerMonthElement: <Price currency={currency}>{pricePerOnePerMonth}</Price>,
            priceForAllPerMonth: addon.quantity * pricePerOnePerMonth,
            priceForAllPerMonthElement: <Price currency={currency}>{addon.quantity * pricePerOnePerMonth}</Price>,
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
