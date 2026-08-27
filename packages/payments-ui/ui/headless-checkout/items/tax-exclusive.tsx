import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import { formatTax } from '../tax-helpers';
import type { BaseLineItem } from './base-line-item';

export const TAX_EXCLUSIVE_LINE_ITEM_TYPE = 'taxExclusive' as const;

export interface TaxExclusiveLineItem
    extends BaseLineItem<typeof TAX_EXCLUSIVE_LINE_ITEM_TYPE>, ReturnType<typeof formatTaxExclusive> {}

function formatTaxExclusive(ctx: HeadlessCheckoutContextInner) {
    const { isTaxExclusive, currency } = ctx;

    const formattedTaxInfo = formatTax(ctx.checkResult);

    const taxRate = formattedTaxInfo?.rate ?? 0;
    const taxAmount = formattedTaxInfo?.amount ?? 0;

    const taxesQuantity = formattedTaxInfo?.taxesQuantity ?? 0;

    return {
        rate: taxRate,
        amount: taxAmount,
        taxesQuantity,
        currency: formattedTaxInfo?.currency ?? currency,
        visible: isTaxExclusive && formattedTaxInfo !== null,
        taxRateElement: formattedTaxInfo?.taxRateElement,
        taxAmountElement: formattedTaxInfo?.taxAmountElement,
        taxRateAndAmountElement: formattedTaxInfo?.taxRateAndAmountElement,
    };
}

export function createTaxExclusiveItem(ctx: HeadlessCheckoutContextInner): TaxExclusiveLineItem {
    return {
        type: TAX_EXCLUSIVE_LINE_ITEM_TYPE,
        ...formatTaxExclusive(ctx),
    };
}
