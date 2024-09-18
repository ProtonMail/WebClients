import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import type { Currency } from '@proton/shared/lib/interfaces';

export const getDiscountPrice = (discount: number, currency: Currency) => {
    return discount ? (
        <>
            {c('Subscription saving').t`Save`}
            <Price className="ml-1" currency={currency}>
                {discount}
            </Price>
        </>
    ) : null;
};
