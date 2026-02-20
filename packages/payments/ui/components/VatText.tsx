import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';

import type { RequiredCheckResponse } from '../../core/checkout';
import { TaxInclusive } from '../../core/subscription/constants';
import { isTaxExclusive, isTaxInclusive } from '../../core/subscription/helpers';
import { getTaxInclusiveRateAndAmountText } from '../headless-checkout/items/tax-inclusive';
import { formatTax } from '../headless-checkout/tax-helpers';

interface Props {
    checkResult: RequiredCheckResponse;
    className?: string;
}

export const VatText = ({ checkResult, className }: Partial<Props>) => {
    if (!checkResult) {
        return null;
    }

    const formattedTax = formatTax(checkResult);
    if (!formattedTax) {
        return null;
    }

    const { amount, rate: taxRate, currency, taxName, taxesQuantity, inclusive } = formattedTax;

    const taxAmount = (
        <Price key="taxAmount" currency={currency} data-testid="taxAmount">
            {amount}
        </Price>
    );

    const text = (() => {
        if (inclusive === TaxInclusive.INCLUSIVE) {
            return getTaxInclusiveRateAndAmountText(taxRate, taxName, taxAmount, taxesQuantity);
        } else {
            return taxesQuantity > 1
                ? c('Payments').jt`Excluding ${taxRate}% taxes: ${taxAmount}`
                : // translator: example "Excluding 20% VAT: US$10"
                  c('Payments').jt`Excluding ${taxRate}% ${taxName}: ${taxAmount}`;
        }
    })();

    return (
        <div className={className} data-testid="tax">
            <span>{text}</span>
        </div>
    );
};

export const InclusiveVatText = ({ checkResult, className }: Partial<Props>) => {
    if (!checkResult || !isTaxInclusive(checkResult)) {
        return null;
    }

    return <VatText checkResult={checkResult} className={className} />;
};

export const ExclusiveVatText = ({ checkResult, className }: Partial<Props>) => {
    if (!checkResult || !isTaxExclusive(checkResult)) {
        return null;
    }

    return <VatText checkResult={checkResult} className={className} />;
};
