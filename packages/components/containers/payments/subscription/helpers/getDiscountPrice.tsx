import { c } from 'ttag';

import type { Currency } from '@proton/payments/core/interface';

import { getSimplePriceString } from '../../../../components/price/helper';

export const getDiscountPrice = (discount: number, currency: Currency) => {
    const priceString = getSimplePriceString(currency, discount);
    return discount ? c('Subscription saving').t`Save ${priceString}` : null;
};
