import { c } from 'ttag';

import { Price } from '@proton/components';
import { formatTax } from '@proton/payments';
import type { RequiredCheckResponse } from '@proton/payments/core/checkout';

interface TaxRowProps {
    checkResult: RequiredCheckResponse;
}

export const TaxRow = ({ checkResult }: Partial<TaxRowProps>) => {
    if (!checkResult) {
        return null;
    }

    const formattedTax = formatTax(checkResult);
    if (!formattedTax) {
        return null;
    }

    const { rate: taxRate, currency, taxName: suggestedTaxName, amount, taxesQuantity } = formattedTax;

    const price = (
        <Price key="price" currency={currency} data-testid="taxAmount">
            {amount}
        </Price>
    );

    const taxName = taxesQuantity > 1 ? c('Payments').t`Taxes` : suggestedTaxName;

    return (
        <div className="flex justify-space-between gap-2" data-testid="tax">
            <span>
                {taxName} {taxRate}
                {'%'}
            </span>
            <span>{price}</span>
        </div>
    );
};
