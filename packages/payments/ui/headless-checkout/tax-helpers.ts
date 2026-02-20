import { c } from 'ttag';

import withDecimalPrecision from '@proton/utils/withDecimalPrecision';

import type { RequiredCheckResponse } from '../../core/checkout';
import { TaxInclusive } from '../../core/subscription/constants';

export type TaxInfo = ReturnType<typeof formatTax>;

export const formatTax = (checkResult: RequiredCheckResponse) => {
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
