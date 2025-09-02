import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import type { Currency } from '@proton/payments';

export const getDiscountPrice = (discount: number, currency: Currency) => {
    const priceString = getSimplePriceString(currency, discount);
    return discount ? c('Subscription saving').t`Save ${priceString}` : null;
};
