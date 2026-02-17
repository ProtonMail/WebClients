import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { TaxInclusive, formatTax } from '@proton/payments';
import type { RequiredCheckResponse } from '@proton/payments/core/checkout';

interface Props {
    checkResult: RequiredCheckResponse;
}

function getVatInclusiveText(formattedTax: NonNullable<ReturnType<typeof formatTax>>) {
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
        return null;
    }
}

const VatInclusiveText = ({ checkResult }: Partial<Props>) => {
    if (!checkResult) {
        return null;
    }

    const formattedTax = formatTax(checkResult);
    if (!formattedTax) {
        return null;
    }

    return (
        <div className="color-weak text-xs text-normal" data-testid="tax">
            {getVatInclusiveText(formattedTax)}
        </div>
    );
};

export default VatInclusiveText;
