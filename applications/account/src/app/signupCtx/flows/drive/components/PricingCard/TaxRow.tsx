import { c } from 'ttag';

import { Price } from '@proton/components';
import type { RequiredCheckResponse } from '@proton/payments/core/checkout';
import { TaxInclusive } from '@proton/payments/core/subscription/constants';
import { formatTax } from '@proton/payments/ui/headless-checkout/tax-helpers';

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

    const taxAmountElement = (
        <Price key="price" currency={currency} data-testid="taxAmount">
            {amount}
        </Price>
    );

    return (
        <div className="flex justify-space-between gap-2" data-testid="tax">
            <span>
                {(() => {
                    if (checkResult.TaxInclusive === TaxInclusive.INCLUSIVE) {
                        const multipleInclusiveTaxesText = c('Payments').t`Including ${taxRate}% taxes`;
                        const singleInclusiveTaxesText = c('Payments').t`Including ${taxRate}% ${suggestedTaxName}`;

                        return taxesQuantity > 1 ? multipleInclusiveTaxesText : singleInclusiveTaxesText;
                    } else if (checkResult.TaxInclusive === TaxInclusive.EXCLUSIVE) {
                        const multipleExclusiveTaxesText = c('Payments').t`${taxRate}% taxes`;
                        const singleExclusiveTaxesText = `${taxRate}% ${suggestedTaxName}`;

                        return taxesQuantity > 1 ? multipleExclusiveTaxesText : singleExclusiveTaxesText;
                    }
                })()}
            </span>
            <span>{taxAmountElement}</span>
        </div>
    );
};
