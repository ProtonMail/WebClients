import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { TaxMode } from '@proton/payments/core/subscription/constants';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import withDecimalPrecision from '@proton/utils/withDecimalPrecision';

export const formatTax = (checkResult: SubscriptionEstimation) => {
    const taxesQuantity = checkResult.Taxes?.length ?? 0;
    if (!checkResult.Taxes || !taxesQuantity) {
        return null;
    }

    const taxMode = checkResult.TaxMode;

    const amount = checkResult.Taxes.reduce((acc, tax) => acc + tax.Amount, 0);
    const rate = withDecimalPrecision(
        checkResult.Taxes.reduce((acc, tax) => acc + tax.Rate, 0),
        4
    );

    const taxExclusiveShortElement =
        taxesQuantity > 1 ? c('Payments').t`Taxes ${rate}%` : c('Payments').t`Tax ${rate}%`;

    const taxInclusiveShortElement =
        taxesQuantity > 1 ? c('Payments').t`Including ${rate}% taxes` : c('Payments').t`Including ${rate}% tax`;

    const taxRateElement = taxMode === TaxMode.EXCLUSIVE ? taxExclusiveShortElement : taxInclusiveShortElement;

    const taxAmountElement = (
        <Price key="taxAmount" currency={checkResult.Currency} data-testid="taxAmount">
            {amount}
        </Price>
    );

    const taxExclusiveLongElement =
        taxesQuantity > 1
            ? c('Payments').jt`${rate}% taxes: ${taxAmountElement}`
            : c('Payments').jt`${rate}% tax: ${taxAmountElement}`;

    const taxInclusiveLongElement =
        taxesQuantity > 1
            ? c('Payments').jt`Including ${rate}% taxes: ${taxAmountElement}`
            : c('Payments').jt`Including ${rate}% tax: ${taxAmountElement}`;

    const taxRateAndAmountElement = taxMode === TaxMode.EXCLUSIVE ? taxExclusiveLongElement : taxInclusiveLongElement;

    return {
        amount,
        rate,
        inclusive: taxMode ?? TaxMode.INCLUSIVE,
        currency: checkResult.Currency,
        taxesQuantity,
        taxAmountElement,
        taxRateElement,
        taxRateAndAmountElement,
    };
};
