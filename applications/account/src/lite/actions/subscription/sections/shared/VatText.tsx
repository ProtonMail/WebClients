import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import type { RequiredCheckResponse } from '@proton/payments';
import { TaxInclusive, formatTax } from '@proton/payments';

interface Props {
    checkResult: RequiredCheckResponse;
}

function getVatText(formattedTax: NonNullable<ReturnType<typeof formatTax>>) {
    const { amount, rate: taxRate, currency, taxName, taxesQuantity, inclusive } = formattedTax;

    const taxAmount = (
        <Price key="taxAmount" currency={currency} data-testid="taxAmount">
            {amount}
        </Price>
    );

    if (inclusive === TaxInclusive.INCLUSIVE) {
        return taxesQuantity > 1
            ? c('Payments').jt`Incl. ${taxRate}% taxes: ${taxAmount}`
            : // translator: example "Incl. 20% VAT: US$10"
              c('Payments').jt`Incl. ${taxRate}% ${taxName}: ${taxAmount}`;
    } else {
        return taxesQuantity > 1
            ? c('Payments').jt`Excl. ${taxRate}% taxes: ${taxAmount}`
            : // translator: example "Excl. 20% VAT: US$10"
              c('Payments').jt`Excl. ${taxRate}% ${taxName}: ${taxAmount}`;
    }
}

const VatText = ({ checkResult }: Partial<Props>) => {
    if (!checkResult) {
        return null;
    }

    const formattedTax = formatTax(checkResult);
    if (!formattedTax) {
        return null;
    }

    return (
        <div className="color-weak text-xs text-normal" data-testid="tax">
            {getVatText(formattedTax)}
        </div>
    );
};

export default VatText;
