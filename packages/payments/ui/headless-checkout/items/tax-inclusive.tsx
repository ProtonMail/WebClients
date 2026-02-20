import type { ReactNode } from 'react';

import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import { formatTax } from '../tax-helpers';
import type { BaseLineItem } from './base-line-item';

// translator: example "Including 20% VAT: US$10"
export const getTaxInclusiveRateAndAmountText = (
    taxRate: number,
    taxName: string,
    taxAmountElement: ReactNode,
    taxesQuantity: number
) =>
    taxesQuantity > 1
        ? c('Payments').jt`Including ${taxRate}% taxes: ${taxAmountElement}`
        : c('Payments').jt`Including ${taxRate}% ${taxName}: ${taxAmountElement}`;

export const TAX_INCLUSIVE_LINE_ITEM_TYPE = 'taxInclusive' as const;

export interface TaxInclusiveLineItem
    extends BaseLineItem<typeof TAX_INCLUSIVE_LINE_ITEM_TYPE>, ReturnType<typeof formatTaxInclusive> {}

function formatTaxInclusive(ctx: HeadlessCheckoutContextInner) {
    const { isTaxInclusive, currency } = ctx;

    const formattedTaxInfo = formatTax(ctx.checkResult);

    const taxName = formattedTaxInfo?.taxName ?? '';
    const taxRate = formattedTaxInfo?.rate ?? 0;
    const taxAmountNumber = formattedTaxInfo?.amount ?? 0;

    const taxAmountElement = (
        <Price key="taxAmount" currency={currency} data-testid="taxAmount">
            {taxAmountNumber}
        </Price>
    );

    const taxesQuantity = formattedTaxInfo?.taxesQuantity ?? 0;

    return {
        taxName,
        rate: taxRate,
        amount: taxAmountNumber,
        taxesQuantity,
        currency: formattedTaxInfo?.currency ?? currency,
        visible: isTaxInclusive && formattedTaxInfo !== null,
        taxRateElement:
            taxesQuantity > 1
                ? c('Payments').t`Including ${taxRate}% taxes`
                : c('Payments').t`Including ${taxRate}% ${taxName}`,
        taxAmountElement,
        taxRateAndAmountElement: getTaxInclusiveRateAndAmountText(taxRate, taxName, taxAmountElement, taxesQuantity),
    };
}

export function createTaxInclusiveItem(ctx: HeadlessCheckoutContextInner): TaxInclusiveLineItem {
    return {
        type: TAX_INCLUSIVE_LINE_ITEM_TYPE,
        ...formatTaxInclusive(ctx),
    };
}
