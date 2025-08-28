import { c } from 'ttag';

import withDecimalPrecision from '@proton/utils/withDecimalPrecision';

import type { RequiredCheckResponse } from './checkout';
import type { Currency } from './interface';
import { TaxInclusive } from './subscription/constants';

export const formatTax = (
    checkResult: RequiredCheckResponse
): {
    amount: number;
    rate: number;
    inclusive: TaxInclusive;
    currency: Currency;
    taxName: string;
    taxesQuantity: number;
} | null => {
    const taxesQuantity = checkResult.Taxes?.length ?? 0;
    if (!checkResult.Taxes || !taxesQuantity) {
        return null;
    }

    const amount = checkResult.Taxes.reduce((acc, tax) => acc + tax.Amount, 0);
    const rate = withDecimalPrecision(
        checkResult.Taxes.reduce((acc, tax) => acc + tax.Rate, 0),
        4
    );

    const taxName = (() => {
        const vatName = c('Payments').t`VAT`;
        if (taxesQuantity === 1) {
            return checkResult.Taxes[0]?.Name ?? vatName;
        }

        return vatName;
    })();

    return {
        amount,
        rate,
        inclusive: checkResult.TaxInclusive ?? TaxInclusive.INCLUSIVE,
        currency: checkResult.Currency,
        taxesQuantity,
        taxName,
    };
};
