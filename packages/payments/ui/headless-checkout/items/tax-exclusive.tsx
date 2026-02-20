import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import { formatTax } from '../tax-helpers';
import type { BaseLineItem } from './base-line-item';

export const TAX_EXCLUSIVE_LINE_ITEM_TYPE = 'taxExclusive' as const;

export interface TaxExclusiveLineItem
    extends BaseLineItem<typeof TAX_EXCLUSIVE_LINE_ITEM_TYPE>, ReturnType<typeof formatTaxExclusive> {}

function formatTaxExclusive(ctx: HeadlessCheckoutContextInner) {
    const { isTaxExclusive, currency } = ctx;

    const formattedTaxInfo = formatTax(ctx.checkResult);

    const taxName = formattedTaxInfo?.taxName ?? '';
    const taxRate = formattedTaxInfo?.rate ?? 0;
    const taxAmount = formattedTaxInfo?.amount ?? 0;

    const taxAmountElement = (
        <Price key="taxAmount" currency={currency} data-testid="taxAmount">
            {taxAmount}
        </Price>
    );

    const taxesQuantity = formattedTaxInfo?.taxesQuantity ?? 0;

    return {
        taxName,
        rate: taxRate,
        amount: taxAmount,
        taxesQuantity,
        currency: formattedTaxInfo?.currency ?? currency,
        visible: isTaxExclusive && formattedTaxInfo !== null,
        taxRateElement: taxesQuantity > 1 ? `${taxRate}% taxes` : `${taxRate}% ${taxName}`,
        taxAmountElement,
        taxRateAndAmountElement:
            taxesQuantity > 1
                ? c('Payments').jt`${taxRate}% taxes: ${taxAmountElement}`
                : c('Payments').jt`${taxRate}% ${taxName}: ${taxAmountElement}`,
    };
}

export function createTaxExclusiveItem(ctx: HeadlessCheckoutContextInner): TaxExclusiveLineItem {
    return {
        type: TAX_EXCLUSIVE_LINE_ITEM_TYPE,
        ...formatTaxExclusive(ctx),
    };
}
