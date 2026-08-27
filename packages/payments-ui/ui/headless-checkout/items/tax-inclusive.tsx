import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import { formatTax } from '../tax-helpers';
import type { BaseLineItem } from './base-line-item';

export const TAX_INCLUSIVE_LINE_ITEM_TYPE = 'taxInclusive' as const;

export interface TaxInclusiveLineItem
    extends BaseLineItem<typeof TAX_INCLUSIVE_LINE_ITEM_TYPE>, ReturnType<typeof formatTaxInclusive> {}

function formatTaxInclusive(ctx: HeadlessCheckoutContextInner) {
    const { isTaxInclusive, currency } = ctx;

    const formattedTaxInfo = formatTax(ctx.checkResult);

    const taxRate = formattedTaxInfo?.rate ?? 0;
    const taxAmountNumber = formattedTaxInfo?.amount ?? 0;

    const taxesQuantity = formattedTaxInfo?.taxesQuantity ?? 0;

    return {
        rate: taxRate,
        amount: taxAmountNumber,
        taxesQuantity,
        currency: formattedTaxInfo?.currency ?? currency,
        visible: isTaxInclusive && formattedTaxInfo !== null,
        taxRateElement: formattedTaxInfo?.taxRateElement,
        taxAmountElement: formattedTaxInfo?.taxAmountElement,
        taxRateAndAmountElement: formattedTaxInfo?.taxRateAndAmountElement,
    };
}

export function createTaxInclusiveItem(ctx: HeadlessCheckoutContextInner): TaxInclusiveLineItem {
    return {
        type: TAX_INCLUSIVE_LINE_ITEM_TYPE,
        ...formatTaxInclusive(ctx),
    };
}
